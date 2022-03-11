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
            'Endpoint=sb://sb-gllaw-flow-api.servicebus.windows.net/;SharedAccessKeyName=DemoPolicy;SharedAccessKey=aJtMssl803ENtxKHzPNP1UHXmedZu0RJJxTOvgpui2I=',
        },
      },
    ]),
  ],
  controllers: [AppController],
})
export class AppModule {}
