import { NestFactory } from '@nestjs/core';
import { PrismaService } from '@prisma/prisma.service';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Obtenha o serviço de banco de dados
  const dbService = app.get(PrismaService);
  
  // Teste a conexão
  await dbService.onModuleInit();
  
  await app.listen(3000);
}
bootstrap();