import { Module } from '@nestjs/common';
import { DataServicesModule } from 'src/services/data-services/data-services.module';
import { UseCasesModule } from 'src/use-cases/use-cases.module';
import { AuthController } from './controllers/auth/auth.controller';
import { UserController } from './controllers/user/user.controller';

@Module({
  imports: [DataServicesModule, UseCasesModule],
  controllers: [AuthController, UserController],
})
export class HttpModule {}
