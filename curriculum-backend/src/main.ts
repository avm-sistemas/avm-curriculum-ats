import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- CONFIGURAÇÃO CORS ---
  app.enableCors({
    origin: 'http://localhost:4200', // <--- ESSENCIAL: Permita o seu frontend Angular
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', // <--- Certifique-se de incluir OPTIONS e os métodos que você usa
    credentials: true, // <--- Importante se você estiver usando cookies ou autenticação baseada em sessão (Firebase auth token passa via header, mas é bom ter para compatibilidade)
    allowedHeaders: 'Content-Type, Accept, Authorization', // <--- Adicione 'Authorization' aqui!
  });
  // --- FIM DA CONFIGURAÇÃO CORS ---

  app.useGlobalPipes(new ValidationPipe()); // Se estiver usando

  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
