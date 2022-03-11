import { AzureServiceBusServer } from '@gllawuk/nestjs-azure-service-bus';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.connectMicroservice<MicroserviceOptions>({
    strategy: new AzureServiceBusServer({
      connectionString:
        'Endpoint=sb://<Name>.servicebus.windows.net/;SharedAccessKeyName=<SharedAccessKeyName>;SharedAccessKey=<SharedAccessKey>',
    }),
  });

  await app.startAllMicroservices();
  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
