import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpErrorFilter } from './filters/filters';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const swaggerConfig = new DocumentBuilder()
    .setTitle('PF-EclipseRoyale')
    .setDescription(
      'Este es un proyecto para el último módulo de Henry y el hotel EclipseRoyale',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  app.enableCors({
    origin: [
      'http://localhost:3001',
<<<<<<< HEAD
      'https://front-hotel-app-g8u2.vercel.app',
      "https://front-hotel-app-six.vercel.app/"
=======
      'https://front-hotel-app-six.vercel.app/',
>>>>>>> 1c538a2b7e095d5ca4e03670126e0c024589cf68
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalFilters(new HttpErrorFilter());

  await app.listen(3000);
}
bootstrap();
