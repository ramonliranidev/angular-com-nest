import { Module } from '@nestjs/common';
import { AuthModule } from './frameworks/auth/auth.module';
import { HttpModule } from './http/http.module';

@Module({
  imports: [HttpModule, AuthModule],
})
export class AppModule {}
