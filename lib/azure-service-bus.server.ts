import {
  CustomTransportStrategy,
  Server,
  WritePacket,
} from '@nestjs/microservices';
import {
  MessageHandlers,
  ProcessErrorArgs,
  ServiceBusClient,
  ServiceBusClientOptions,
  ServiceBusMessage,
  ServiceBusReceivedMessage,
} from '@azure/service-bus';

import { SB_DEFAULT_CONNECTION_STRING } from './azure-service-bus.constant';
import { AzureServiceBusServerOptions } from './azure-service-bus.interface';
import { AzureServiceBusContext } from './azure-service-bus.context';

export class AzureServiceBusServer
  extends Server
  implements CustomTransportStrategy
{
  private sbClient: ServiceBusClient;
  protected connectionString: string;

  constructor(
    protected readonly options: AzureServiceBusServerOptions['options'],
  ) {
    super();
    this.connectionString =
      this.getOptionsProp(this.options, 'connectionString') ||
      SB_DEFAULT_CONNECTION_STRING;

    this.initializeSerializer(options);
    this.initializeDeserializer(options);
  }

  public async listen(
    callback: (err?: unknown, ...optionalParams: unknown[]) => void,
  ): Promise<void> {
    try {
      this.sbClient = this.createServiceBusClient();
      await this.start(callback);
    } catch (err) {
      callback(err);
    }
  }

  public async start(
    callback: (err?: unknown, ...optionalParams: unknown[]) => void,
  ): Promise<void> {
    await this.bindEvents(this.sbClient);
    callback();
  }

  public async bindEvents(sbClient: ServiceBusClient): Promise<void> {
    const subscribe = async (queueName: string) => {
      const reciever = sbClient.createReceiver(queueName);
      reciever.subscribe(this.createMessageHandlers(queueName));
      await reciever.close();
    };

    const registeredPatterns = [...this.messageHandlers.keys()];
    await Promise.all(registeredPatterns.map(subscribe));
  }

  public createMessageHandlers = (pattern: string): MessageHandlers => ({
    processMessage: async (receivedMessage: ServiceBusReceivedMessage) =>
      await this.handleMessage(receivedMessage, pattern),
    processError: async (args: ProcessErrorArgs): Promise<void> => {
      return new Promise<void>(() => {
        console.error(`Error processing message: ${args.error}`);
      });
    },
  });

  public async handleMessage(
    receivedMessage: ServiceBusReceivedMessage,
    pattern: string,
  ): Promise<void> {
    const partialPacket = { data: receivedMessage, pattern };
    const packet = await this.deserializer.deserialize(partialPacket);

    if (!receivedMessage.replyTo) {
      const sbContext = new AzureServiceBusContext([]);
      return this.handleEvent(packet.pattern, packet, sbContext);
    }

    const publish = this.getPublisher(
      receivedMessage.replyTo,
      receivedMessage.messageId as string,
    );

    const handler = this.getHandlerByPattern(pattern);
    const response$ = this.transformToObservable(
      await handler(receivedMessage),
    );
    response$ && this.send(response$, publish);
  }

  public getPublisher(replyTo: string, correlationId: string) {
    return async (data: WritePacket) => {
      const sender = this.sbClient.createSender(replyTo);
      const responseMessage = {
        correlationId,
        body: data.response,
      } as ServiceBusMessage;
      await sender.sendMessages([responseMessage]);
      await sender.close();
    };
  }

  public createServiceBusClient(): ServiceBusClient {
    const options = this.options || ({} as ServiceBusClientOptions);
    return new ServiceBusClient(this.connectionString, options);
  }

  public async close(): Promise<void> {
    await this.sbClient.close();
  }
}
