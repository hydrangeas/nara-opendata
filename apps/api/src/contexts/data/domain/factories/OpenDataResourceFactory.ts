import { createFilePath, convertUrlPathToFilePath } from '../value-objects/FilePath';
import { createContentType } from '../value-objects/ContentType';
import { createFileSize } from '../value-objects/FileSize';
import type { OpenDataResource } from '../value-objects/OpenDataResource';
import { createOpenDataResource } from '../value-objects/OpenDataResource';
import { DataAccessService } from '../services/DataAccessService';

/**
 * OpenDataResourceの生成を担当するファクトリ
 */
export class OpenDataResourceFactory {
  /**
   * ファイルパスからリソースを作成する
   */
  static createFromPath(
    path: string,
    options?: {
      fileSizeBytes?: number;
      contentType?: string;
    },
  ): OpenDataResource {
    const filePath = createFilePath(path);
    const contentType = options?.contentType
      ? createContentType(options.contentType)
      : DataAccessService.getContentTypeFromPath(path);
    const fileSize = options?.fileSizeBytes ? createFileSize(options.fileSizeBytes) : undefined;

    return createOpenDataResource({
      path: filePath,
      contentType,
      ...(fileSize && { fileSize }),
    });
  }

  /**
   * URLパスからリソースを作成する
   */
  static createFromUrl(
    urlPath: string,
    options?: {
      fileSizeBytes?: number;
      contentType?: string;
    },
  ): OpenDataResource {
    const filePath = convertUrlPathToFilePath(urlPath);
    const contentType = options?.contentType
      ? createContentType(options.contentType)
      : DataAccessService.getContentTypeFromPath(filePath.value);
    const fileSize = options?.fileSizeBytes ? createFileSize(options.fileSizeBytes) : undefined;

    return createOpenDataResource({
      path: filePath,
      contentType,
      ...(fileSize && { fileSize }),
    });
  }

  /**
   * ファイル情報オブジェクトからリソースを作成する
   */
  static createFromFileInfo(fileInfo: {
    path: string;
    contentType?: string;
    sizeBytes?: number;
  }): OpenDataResource {
    const filePath = createFilePath(fileInfo.path);
    const contentType = fileInfo.contentType
      ? createContentType(fileInfo.contentType)
      : DataAccessService.getContentTypeFromPath(fileInfo.path);
    const fileSize = fileInfo.sizeBytes ? createFileSize(fileInfo.sizeBytes) : undefined;

    return createOpenDataResource({
      path: filePath,
      contentType,
      ...(fileSize && { fileSize }),
    });
  }
}
