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

  /**
   * 複数のパスから一括でリソースを作成する
   * 無効なパスはスキップされる
   */
  static createBatch(paths: string[]): OpenDataResource[] {
    const resources: OpenDataResource[] = [];

    for (const path of paths) {
      try {
        const resource = this.createFromPath(path);
        resources.push(resource);
      } catch (error) {
        // 無効なパスはスキップ
        // 開発環境でのみ警告を出力（本番環境では静かにスキップ）
        if (process.env['NODE_ENV'] === 'development') {
          console.warn(`[OpenDataResourceFactory] Skipped invalid path: ${path}`, error);
        }
        // TODO: 将来的には適切なロガー（pino等）を使用して、
        // 本番環境でも適切なログレベルで記録する
      }
    }

    return resources;
  }
}
