import { DynamicModule, Module, Provider } from '@nestjs/common';

import { SB_MODULE_OPTIONS } from './azure-storage-blob.constant';
import {
  AzureStorageBlobOptions,
  AzureStorageBlobAsyncOptions,
  AzureStorageBlobOptionsFactory,
} from './azure-storage-blob.interface';
import { AzureStorageBlobService } from './azure-storage-blob.service';

@Module({
  providers: [AzureStorageBlobService],
  exports: [AzureStorageBlobService, SB_MODULE_OPTIONS],
})
export class AzureStorageBlobModule {
  static register(options: AzureStorageBlobOptions): DynamicModule {
    return {
      module: AzureStorageBlobModule,
      providers: [{ provide: SB_MODULE_OPTIONS, useValue: options }],
    };
  }

  static registerAsync(options: AzureStorageBlobAsyncOptions): DynamicModule {
    return {
      module: AzureStorageBlobModule,
      providers: [...this.createAsyncConfigProviders(options)],
    };
  }

  private static createAsyncConfigProviders(
    options: AzureStorageBlobAsyncOptions,
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncConfigProvider(options)];
    }

    return [
      this.createAsyncConfigProvider(options),
      {
        provide: options.useClass,
        useClass: options.useClass,
      },
    ];
  }

  private static createAsyncConfigProvider(
    options: AzureStorageBlobAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: SB_MODULE_OPTIONS,
        useFactory: async (...args: any[]) => await options.useFactory(...args),
        inject: options.inject || [],
      };
    }
    return {
      provide: SB_MODULE_OPTIONS,
      useFactory: async (optionsFactory: AzureStorageBlobOptionsFactory) =>
        await optionsFactory.createAzureStorageBlobOptions(),
      inject: [options.useExisting || options.useClass],
    };
  }
}
