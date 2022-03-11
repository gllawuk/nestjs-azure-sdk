import { ServiceBusMessage } from '@azure/service-bus';
import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy, EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(@Inject('SB_SERVICE') private readonly sbClient: ClientProxy) {}

  @Get()
  sendHello(): string {
    const message = 'Hello World!';
    this.sbClient.emit('sbq-default', 'Hello World!');
    return message;
  }

  @EventPattern('sbq-default')
  async handleEvent(@Payload() message: ServiceBusMessage) {
    console.log(message.body);
  }
}
