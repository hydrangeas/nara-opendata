import { injectable } from 'tsyringe';
import { OpenDataRepositoryImpl } from '@nara-opendata/infrastructure';
import type { IOpenDataResource } from '@nara-opendata/infrastructure';
import type { IOpenDataRepository } from '../../contexts/data/domain/repositories/IOpenDataRepository';
import type { OpenDataResource } from '../../contexts/data/domain/value-objects/OpenDataResource';
import { createOpenDataResource } from '../../contexts/data/domain/value-objects/OpenDataResource';
import type { FilePath } from '../../contexts/data/domain/value-objects/FilePath';
import { createFilePath } from '../../contexts/data/domain/value-objects/FilePath';
import type { ContentType } from '../../contexts/data/domain/value-objects/ContentType';
import { createContentType } from '../../contexts/data/domain/value-objects/ContentType';
import type { FileSize } from '../../contexts/data/domain/value-objects/FileSize';
import { createFileSize } from '../../contexts/data/domain/value-objects/FileSize';

/**
 * Infrastructure層のOpenDataRepositoryImplをAPI層のインターフェースに適合させるアダプター
 */
@injectable()
export class OpenDataRepositoryAdapter implements IOpenDataRepository {
  private readonly impl: OpenDataRepositoryImpl;

  constructor() {
    this.impl = new OpenDataRepositoryImpl();
  }

  async findByPath(path: FilePath): Promise<OpenDataResource | null> {
    const result = await this.impl.findByPath({ value: path.value });

    if (!result) {
      return null;
    }

    const resource: {
      path: FilePath;
      contentType: ContentType;
      fileSize?: FileSize;
    } = {
      path,
      contentType: createContentType(result.contentType.value),
    };

    if (result.fileSize) {
      resource.fileSize = createFileSize(result.fileSize.bytes);
    }

    return createOpenDataResource(resource);
  }

  async exists(path: FilePath): Promise<boolean> {
    return this.impl.exists({ value: path.value });
  }

  async getContent(resource: OpenDataResource): Promise<Buffer> {
    const infraResource: {
      path: { value: string };
      contentType: { value: string };
      fileSize?: { bytes: number };
    } = {
      path: { value: resource.path.value },
      contentType: { value: resource.contentType.value },
    };

    if (resource.fileSize) {
      infraResource.fileSize = { bytes: resource.fileSize.bytes };
    }

    return this.impl.getContent(infraResource);
  }

  async listByPathPrefix(
    pathPrefix: string,
    options?: {
      maxResults?: number;
      contentTypes?: string[];
    },
  ): Promise<OpenDataResource[]> {
    const results = await this.impl.listByPathPrefix(pathPrefix, options);

    return results.map((result: IOpenDataResource) => {
      const resource: {
        path: FilePath;
        contentType: ContentType;
        fileSize?: FileSize;
      } = {
        path: createFilePath(result.path.value),
        contentType: createContentType(result.contentType.value),
      };

      if (result.fileSize) {
        resource.fileSize = createFileSize(result.fileSize.bytes);
      }

      return createOpenDataResource(resource);
    });
  }
}
