import { IMailService } from '@core/abstracts/mail-services.abstract';
import { CreateUserDto, UpdateUserDto } from '@core/dtos/user.dto';
import { User } from '@core/entities/user.entity';
import { genericError, notFoundError } from '@helpers/errors';
import { excludeFieldFromUser } from '@helpers/excludeFieldFromUser';
import { getEmailTemplatePath } from '@helpers/getEmailTemplatePath';
import { validateCPFCNPJ } from '@helpers/validateCpfCnpj';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { randomUUID } from 'crypto';
import { get } from 'lodash';
import { UserFactoryService } from './user-factory.service';

@Injectable()
export class UserUseCases {
  constructor(
    private prismaService: PrismaService,
    private userFactoryService: UserFactoryService,
    private mailService: IMailService,
  ) {}

  getAll(): Promise<User[]> {
    return this.prismaService.user.findMany();
  }

  async getById(id: string) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id, deletedAt: null },
      });
      if (!user) throw notFoundError;

      return excludeFieldFromUser(user, 'password');
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw notFoundError;
      }

      throw genericError;
    }
  }

  async getUserByEmail(email: string) {
    const user = await this.prismaService.user.findFirst({
      where: {
        email,
      },
    });
    if (!user) {
      return null;
    }
    return excludeFieldFromUser(user, 'password');
  }

  async getUserByDocument(document: string) {
    return this.prismaService.user.findFirst({
      where: {
        document,
        deletedAt: null,
      },
    });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const document = get(createUserDto, 'document');

    if (document && !validateCPFCNPJ(document)) {
      throw new BadRequestException('CPF ou CNPJ está incorreto.');
    }

    await this.validateUniqueInformation(null, createUserDto);

    return await this.prismaService.$transaction(async (prisma) => {
      const user = await this.userFactoryService.createNewUser(createUserDto);

      const newUser = await prisma.user.create({
        data: user,
      });

      await this.sendWelcomeEmail(newUser);

      return newUser;
    });
  }

  async sendWelcomeEmail(newUser: User) {
    const subject = 'Confirmação de e-mail';
    const code = randomUUID();
    const linkVerification = `${process.env.FRONTEND_URL}/auth/validade-email/${code}`;

    const templatePath = getEmailTemplatePath('confirm-email.hbs');

    const emailSent = await this.mailService.sendEmail({
      to: newUser.email,
      subject,
      variables: {
        name: newUser.name,
        email: newUser.email,
        linkVerification,
      },
      path: templatePath,
    });

    if (emailSent) {
      await this.prismaService.emailVerification.create({
        data: {
          email: newUser.email,
        },
      });
    }
  }

  async validateUniqueInformation(
    currentUser: Omit<User, 'password'>,
    userDto: CreateUserDto | UpdateUserDto,
  ) {
    let userExists = null;
    const currentDocument = get(currentUser, 'document', '');
    const currentEmail = get(currentUser, 'email', '');

    if (userDto.document && currentDocument !== userDto.document) {
      userExists = await this.getUserByDocument(userDto.document);

      if (userExists) {
        throw new ForbiddenException('CPF ou CNPJ já cadastrado.');
      }
    }

    if (currentEmail !== userDto.email) {
      userExists = null;
      userExists = await this.getUserByEmail(userDto.email);

      if (userExists) {
        throw new ForbiddenException(
          'E-mail já cadastrado, informe outro e-mail.',
        );
      }
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<void> {
    const document = get(updateUserDto, 'document');

    if (document && !validateCPFCNPJ(document)) {
      throw new BadRequestException('CPF ou CNPJ está incorreto.');
    }

    const currentUser = await this.getById(id);

    await this.validateUniqueInformation(currentUser, updateUserDto);
    const user = this.userFactoryService.updateUser(updateUserDto);

    try {
      await this.prismaService.user.update({
        where: { id },
        data: { ...user },
      });
    } catch (error) {
      throw genericError;
    }
  }

  async delete(id: string) {
    await this.getById(id);

    try {
      await this.prismaService.user.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });
    } catch (error) {
      throw genericError;
    }
  }
}
