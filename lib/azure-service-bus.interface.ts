import { Type } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ServiceBusClientOptions } from '@azure/service-bus';

export interface AzureServiceBusClientOptions {
  customClass: Type<ClientProxy>;
  options: { connectionString: string } & ServiceBusClientOptions;
}

export interface AzureServiceBusServerOptions {
  options: { connectionString: string } & ServiceBusClientOptions;
}
