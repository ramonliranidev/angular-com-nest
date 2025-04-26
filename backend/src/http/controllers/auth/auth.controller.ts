import { Public } from '@auth-decorators/public.decorator';
import { ForgotPasswordDto } from '@core/dtos/forgot-password.dto';
import { LoginDto } from '@core/dtos/login.dto';
import { RecoverPasswordDto } from '@core/dtos/recover-password.dto';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res
} from '@nestjs/common';
import { AuthUseCases } from '@use-cases/auth/auth.use-case';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authUseCase: AuthUseCases) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() response: Response) {
    const { login, password } = loginDto;

    const user = await this.authUseCase.validateUser(login, password);

    const token = await this.authUseCase.login({ user });

    return response.status(200).json({
      error: false,
      token,
    });
  }

  @Public()
  @Get('/verify-token-recovery-password/:token')
  async verifyTokenRecoverPassword(
    @Param('token') token: string,
    @Res() response: Response,
  ) {
    const tokenIsValid = await this.authUseCase.verifyTokenRecoverPassword(token);

    return response.status(200).json({
      error: false,
      tokenIsValid: tokenIsValid,
    });
  }

  @Public()
  @Post('/forgot-password')
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Res() response: Response,
  ) {
    const { email } = forgotPasswordDto;

    const type = await this.authUseCase.forgotPassword(email);

    return response.status(200).json({
      error: false,
      type,
    });
  }

  @Public()
  @Post('/recover-password')
  async recoverPassword(
    @Body() recoverPasswordDto: RecoverPasswordDto,
    @Res() response: Response,
  ) {
    const { password, token } = recoverPasswordDto;

    const success = await this.authUseCase.recoverPassword(password, token);

    return response.status(200).json({
      error: false,
      success,
    });
  }
}
