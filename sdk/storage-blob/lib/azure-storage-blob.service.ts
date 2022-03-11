import { Inject, Injectable } from '@nestjs/common';
import {
  BlockBlobParallelUploadOptions,
  BlobItem,
  BlobGetPropertiesOptions,
  BlobServiceClient,
  BlockBlobUploadOptions,
  ContainerItem,
  ContainerListBlobsOptions,
  ServiceListContainersOptions,
  StorageSharedKeyCredential,
  BlobDownloadOptions,
  HttpRequestBody,
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

  async listContainers(options?: ServiceListContainersOptions) {
    const list: ContainerItem[] = [];
    for await (const container of this.blobServiceClient.listContainers(
      options,
    )) {
      list.push(container);
    }
    return list;
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

  async getBlobProperties(
    containerName: string,
    blobName: string,
    options?: BlobGetPropertiesOptions,
  ) {
    const containerClient =
      this.blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    return await blockBlobClient.getProperties(options);
  }

  async upload(
    containerName: string,
    blobName: string,
    body: HttpRequestBody,
    contentLength: number,
    options?: BlockBlobUploadOptions,
  ) {
    const containerClient =
      this.blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    return await blockBlobClient.upload(body, contentLength, options);
  }

  async uploadData(
    containerName: string,
    blobName: string,
    data: Buffer | Blob | ArrayBuffer | ArrayBufferView,
    options?: BlockBlobParallelUploadOptions,
  ) {
    const containerClient =
      this.blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    return await blockBlobClient.uploadData(data, options);
  }

  async download(
    containerName: string,
    blobName: string,
    offset?: number,
    count?: number,
    options?: BlobDownloadOptions,
  ) {
    const containerClient =
      this.blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const downloadBlockBlobResponse = await blockBlobClient.download(
      offset,
      count,
      options,
    );
    return await this.streamToBuffer(
      downloadBlockBlobResponse.readableStreamBody,
    );
  }

  private streamToBuffer(
    readableStream: NodeJS.ReadableStream,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      readableStream.on('data', (data: Buffer | string) => {
        chunks.push(data instanceof Buffer ? data : Buffer.from(data));
      });
      readableStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on('error', reject);
    });
  }
}
