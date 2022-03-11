import { AzureServiceBusClient } from '@gllawuk/nestjs-azure-service-bus';
import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';

import { AppController } from './app.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'SB_SERVICE',
        customClass: AzureServiceBusClient,
        options: {
          connectionString:
            'Endpoint=sb://<Name>.servicebus.windows.net/;SharedAccessKeyName=<SharedAccessKeyName>;SharedAccessKey=<SharedAccessKey>',
        },
      },
    ]),
  ],
  controllers: [AppController],
})
export class AppModule {}
