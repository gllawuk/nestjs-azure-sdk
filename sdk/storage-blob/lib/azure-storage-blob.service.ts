import { Inject, Injectable } from '@nestjs/common';
import {
  BlobItem,
  BlobServiceClient,
  ContainerListBlobsOptions,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';

import { AzureStorageBlobOptions } from './azure-storage-blob.interface';
import {
  SB_DEFAULT_ACCESS_KEY,
  SB_DEFAULT_ACCOUNT_NAME,
  SB_MODULE_OPTIONS,
} from './azure-storage-blob.constant';

@Injectable()
export class AzureStorageBlobService {
  private blobServiceClient: BlobServiceClient;
  protected accountName: string;
  protected accessKey: string;

  constructor(
    @Inject(SB_MODULE_OPTIONS)
    private readonly options: AzureStorageBlobOptions,
  ) {
    this.accountName = this.options.accountName || SB_DEFAULT_ACCOUNT_NAME;
    this.accessKey = this.options.accessKey || SB_DEFAULT_ACCESS_KEY;

    this.blobServiceClient = new BlobServiceClient(
      `https://${this.accountName}.blob.core.windows.net`,
      new StorageSharedKeyCredential(this.accountName, this.accessKey),
    );
  }

  async listBlobsFlat(
    containerName: string,
    options?: ContainerListBlobsOptions,
  ) {
    const containerClient =
      this.blobServiceClient.getContainerClient(containerName);
    const list: BlobItem[] = [];

    for await (const blob of containerClient.listBlobsFlat(options)) {
      list.push(blob);
    }

    return list;
  }
}
