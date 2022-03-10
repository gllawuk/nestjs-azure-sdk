import { Type } from '@nestjs/common';

export interface AzureStorageBlobOptions {
  accountName: string;
  accessKey: string;
}

export interface AzureStorageBlobAsyncOptions {
  useExisting?: Type<AzureStorageBlobOptionsFactory>;
  useClass?: Type<AzureStorageBlobOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<AzureStorageBlobOptions> | AzureStorageBlobOptions;
  inject?: any[];
}

export interface AzureStorageBlobOptionsFactory {
  createAzureStorageBlobOptions():
    | AzureStorageBlobOptions
    | Promise<AzureStorageBlobOptions>;
}
