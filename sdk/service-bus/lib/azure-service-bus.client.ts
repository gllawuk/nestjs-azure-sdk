import {
  MessageHandlers,
  ProcessErrorArgs,
  ServiceBusClient,
  ServiceBusClientOptions,
  ServiceBusMessage,
  ServiceBusReceivedMessage,
} from '@azure/service-bus';
import { Injectable } from '@nestjs/common';
import {
  ClientProxy,
  PacketId,
  ReadPacket,
  WritePacket,
} from '@nestjs/microservices';

import { SB_DEFAULT_QUEUE } from './azure-service-bus.constant';
import { AzureServiceBusClientOptions } from './azure-service-bus.interface';

@Injectable()
export class AzureServiceBusClient extends ClientProxy {
  private sbClient: ServiceBusClient;
  protected connectionString: string;

  constructor(
    protected readonly options: AzureServiceBusClientOptions['options'],
  ) {
    super();
    this.connectionString =
      this.getOptionsProp(this.options, 'connectionString') || SB_DEFAULT_QUEUE;

    this.initializeSerializer(options);
    this.initializeDeserializer(options);
  }

  connect(): Promise<void> {
    if (this.sbClient) {
      this.sbClient;
      return Promise.resolve();
    }
    this.sbClient = this.createServiceBusClient();
    return Promise.resolve();
  }

  async dispatchEvent(packet: ReadPacket<any>): Promise<any> {
    const pattern = this.normalizePattern(packet.pattern);
    const serializedPacket = this.serializer.serialize(packet.data);
    const message = Object.assign({
      body: serializedPacket,
    }) as ServiceBusMessage;

    const sender = this.sbClient.createSender(pattern);
    await sender.sendMessages([message]);
    await sender.close();
  }

  publish(
    partialPacket: ReadPacket<any>,
    callback: (packet: WritePacket<any>) => void,
  ) {
    try {
      const packet = this.assignPacketId(partialPacket);
      const pattern = this.normalizePattern(packet.pattern);
      const serializedPacket = this.serializer.serialize(packet.data);
      const replyTo = this.getReplyTo(pattern);
      const sender = this.sbClient.createSender(pattern);
      const receiver = this.sbClient.createReceiver(replyTo);

      this.routingMap.set(packet.id, callback);

      sender.sendMessages([
        {
          messageId: packet.id,
          body: serializedPacket,
          replyTo,
        } as ServiceBusMessage,
      ]);

      if (replyTo) {
        receiver.subscribe(this.createMessageHandlers(packet));
      }

      return () => {
        sender.close();
        receiver.close();
        this.routingMap.delete(packet.id);
      };
    } catch (err) {
      callback({ err });
    }
  }

  public createMessageHandlers = (
    packet: ReadPacket<any> & PacketId,
  ): MessageHandlers => ({
    processMessage: async (receivedMessage: ServiceBusReceivedMessage) => {
      await this.handleMessage(receivedMessage, packet);
    },
    processError: async (args: ProcessErrorArgs): Promise<void> => {
      return new Promise<void>(() => {
        throw new Error(`Error processing message: ${args.error}`);
      });
    },
  });

  public async handleMessage(
    receivedMessage: ServiceBusReceivedMessage,
    packet: ReadPacket<any> & PacketId,
  ): Promise<void> {
    const { id, isDisposed } = await this.deserializer.deserialize(packet);
    const { body, correlationId, replyTo } = receivedMessage;

    if (replyTo && id !== correlationId) {
      return undefined;
    }

    const callback = this.routingMap.get(id);
    if (!callback) {
      return undefined;
    }

    if (isDisposed) {
      callback({
        response: body,
        isDisposed: true,
      });
    }
    callback({
      response: body,
    });
  }

  public getReplyTo = (pattern: string): string => {
    return `${pattern}.reply`;
  };

  public createServiceBusClient(): ServiceBusClient {
    const options = this.options || ({} as ServiceBusClientOptions);
    return new ServiceBusClient(this.connectionString, options);
  }

  public async close(): Promise<void> {
    await this.sbClient.close();
  }
}
