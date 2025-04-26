import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { isBefore, subDays } from 'date-fns';

import { IMailService } from '@core/abstracts/mail-services.abstract';
import { User } from '@core/entities/user.entity';
import { env } from '@env';
import { decryptPassword } from '@helpers/decryptPassword';
import { encryptPassword } from '@helpers/encryptPassword';
import { excludeFieldFromUser } from '@helpers/excludeFieldFromUser';
import { getEmailTemplatePath } from '@helpers/getEmailTemplatePath';
import { PrismaService } from '@prisma/prisma.service';

type UserWithoutPassword = Omit<User, 'password'>;

interface LoginProps {
  user: UserWithoutPassword;
  updateLastLogin?: boolean;
}

@Injectable()
export class AuthUseCases {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private mailService: IMailService,
  ) {}

  async validateUser(login: string, password: string): Promise<UserWithoutPassword> {
    const user = await this.prismaService.user.findFirst({
      where: {
        OR: [{ email: login }, { username: login }],
        deletedAt: null,
      },
    });
  
    if (user && !user.verifiedAt) {
      throw new NotFoundException('Verifique seu e-mail para realizar o login.');
    }
  
    if (user && decryptPassword(user.password) === password) {
      return excludeFieldFromUser(user, 'password') as UserWithoutPassword;
    }
  
    throw new NotFoundException('E-mail ou senha incorreto.');
  }

  async login({ user, updateLastLogin = true }: LoginProps): Promise<string> {
    const secret = env.PRIVATE_KEY;

    if (updateLastLogin) {
      await this.prismaService.user.update({
        where: {
          email: user.email,
        },
        data: {
          lastLogin: new Date(),
        },
      });
    }

    return this.jwtService.sign(user, {
      expiresIn: '8h',
      secret,
    });
  }

  async forgotPassword(email: string) {
    const hasOldSolicitation = await this.prismaService.resetPassword.findUnique({
      where: { email },
    });

    if (hasOldSolicitation) {
      await this.prismaService.resetPassword.delete({
        where: { email },
      });
    }

    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) return { notFound: true };

    if (!user.verifiedAt) return { notVerifiedAt: true };

    const token = randomUUID();
    const expireIn = new Date();
    const linkVerification = `${process.env.FRONTEND_URL}/auth/recuperar-senha/${token}`;

    const subject = 'Recuperação de senha';
    expireIn.setDate(expireIn.getDate() + 1);

    const templatePath = getEmailTemplatePath('recover-password.hbs');

    const emailSent = await this.mailService.sendEmail({
      to: user.email,
      subject,
      variables: {
        name: user.name,
        email: user.email,
        linkVerification,
      },
      path: templatePath,
    });

    if (emailSent) {
      await this.prismaService.resetPassword.create({
        data: {
          email: user.email,
          token,
          expireIn,
        },
      });
    }

    return { success: true };
  }

  async recoverPassword(password: string, token: string) {
    const recoverPassword = await this.prismaService.resetPassword.findUnique({
      where: {
        token,
      },
    });

    const user = await this.prismaService.user.update({
      where: { email: recoverPassword.email },
      data: {
        password: encryptPassword(password),
      },
    });

    const subject = 'Senha alterada com sucesso.';

    const templatePath = getEmailTemplatePath('recover-password-success.hbs');

    await this.mailService.sendEmail({
      to: user.email,
      subject,
      variables: {
        name: user.name,
        linkToLoginPage: `${process.env.FRONTEND_URL}/auth/login`,
      },
      path: templatePath,
    });

    return true;
  }

  async verifyTokenRecoverPassword(token: string) {
    const twoDaysAgo = subDays(new Date(), 2);

    const recoverPassword = await this.prismaService.resetPassword.findUnique({
      where: {
        token,
      },
    });

    if (!recoverPassword) return false;

    const expiredIn = new Date(recoverPassword.expireIn);
    const isOlderThanTwoDays = isBefore(expiredIn, twoDaysAgo);

    if (isOlderThanTwoDays) return false;

    return true;
  }
}
