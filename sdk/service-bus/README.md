# NestJS Azure Service Bus

[NestJS](https://nestjs.com) custom transport for [Azure Service Bus](https://azure.microsoft.com/en-us/services/service-bus).

## Installation

```bash
$ npm install @gllawuk/nestjs-azure-service-bus @azure/service-bus --save
```

## Overview

```typescript
const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  AppModule,
  {
    strategy: new AzureServiceBusServer({
      connectionString:
        'Endpoint=sb://<Name>.servicebus.windows.net/;SharedAccessKeyName=<SharedAccessKeyName>;SharedAccessKey=<SharedAccessKey>',
    }),
  },
);
```

## Client

```typescript
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
  ]
  ...
})
```

```typescript
@Injectable()
constructor(
  @Inject('SB_SERVICE') private readonly sbClient: ClientProxy,
) {}
```

## Message-based (Request/Response)

Producer:

```typescript
const pattern = 'sbq-default'; // queue name is 'sbq-default.reply'
const data = 'Example message';
this.sbClient.send(pattern, data).subscribe((response) => {
  console.log(response); // reply message
});
```

Consumer:

```typescript
const pattern = 'sbq-default'; // queue name
@MessagePattern(pattern)
handleMessage(@Payload() data) {
  console.log(data);
  return 'Example reply message';
}
```

## Event-based

Producer:

```typescript
const pattern = 'sbq-default'; // queue name
const data = 'Example message';
this.sbClient.emit(pattern, data);
```

Consumer:

```typescript
const pattern = 'sbq-default'; // queue name
@EventPattern('sbq-default')
async handleEvent(data) {
  console.log(data);
}
```
