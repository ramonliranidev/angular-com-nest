import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DataServicesModule } from 'src/services/data-services/data-services.module';
import { MailServicesModule } from 'src/services/mail-services/mail-services.module';
import { AuthUseCases } from './auth/auth.use-case';
import { UserFactoryService } from './user/user-factory.service';
import { UserUseCases } from './user/user.use-case';

@Module({
  imports: [MailServicesModule, DataServicesModule, JwtModule],
  providers: [AuthUseCases, UserFactoryService, UserUseCases],
  exports: [AuthUseCases, UserFactoryService, UserUseCases],
})
export class UseCasesModule {}
