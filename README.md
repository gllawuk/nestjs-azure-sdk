## Description

Custom transport for using [Azure Service Bus](https://azure.microsoft.com/en-us/services/service-bus) with [NestJS](https://nestjs.com).

## Installation

```bash
$ yarn add nestjs-azure-service-bus
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
const pattern = 'sbq-default'; // queue name
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
const pattern = 'sbq-default'; // queue name is 'sbq-default.reply'
@EventPattern(pattern)
async handleEvent(data) {
  console.log(data);
}
```
