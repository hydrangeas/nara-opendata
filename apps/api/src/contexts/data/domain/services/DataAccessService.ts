import { createFilePath, convertUrlPathToFilePath } from '../value-objects/FilePath';
import type { ContentType } from '../value-objects/ContentType';
import { createContentType } from '../value-objects/ContentType';
import type { OpenDataResource } from '../value-objects/OpenDataResource';
import { createOpenDataResource, isResourceAccessible } from '../value-objects/OpenDataResource';

/**
 * データアクセスのビジネスロジックを提供するドメインサービス
 */
export class DataAccessService {
  // デフォルトの最大ファイルサイズ（100MB）
  private static readonly DEFAULT_MAX_FILE_SIZE = 100 * 1024 * 1024;

  /**
   * リソースパスを検証する
   * @throws {PathTraversalException} パストラバーサルが検出された場合
   */
  static validateResourcePath(path: string): void {
    // createFilePathの検証を利用
    createFilePath(path);
  }

  /**
   * URLパスからオープンデータリソースを作成する
   */
  static createResourceFromUrl(urlPath: string): OpenDataResource {
    const filePath = convertUrlPathToFilePath(urlPath);
    const contentType = this.getContentTypeFromPath(filePath.value);

    return createOpenDataResource({
      path: filePath,
      contentType,
      // ファイルサイズは後で設定される
    });
  }

  /**
   * リソースへのアクセスを検証する
   */
  static validateAccess(
    resource: OpenDataResource,
    options: { maxFileSizeBytes?: number } = {},
  ): { allowed: boolean; reason?: string } {
    const maxSize = options.maxFileSizeBytes || this.DEFAULT_MAX_FILE_SIZE;

    // isResourceAccessibleを使用してアクセス可否を判定
    const allowed = isResourceAccessible(resource, { maxFileSizeBytes: maxSize });

    if (!allowed) {
      // 詳細な理由を判定
      if (resource.fileSize && resource.fileSize.bytes > maxSize) {
        return { allowed: false, reason: 'File size exceeds maximum allowed size' };
      }
      return { allowed: false, reason: 'Content type not allowed' };
    }

    return { allowed: true };
  }

  /**
   * ベースパスとファイルパスを結合する
   */
  static buildResourcePath(basePath: string, filePath: string): string {
    // 両端のスラッシュを正規化
    const normalizedBase = basePath.replace(/\/$/, '');
    const normalizedFile = filePath.replace(/^\//, '');

    if (!normalizedBase) {
      return normalizedFile;
    }

    return `${normalizedBase}/${normalizedFile}`;
  }

  /**
   * ファイルパスから適切なコンテンツタイプを推測する
   */
  static getContentTypeFromPath(path: string): ContentType {
    // 複合拡張子を先にチェック
    const lowerPath = path.toLowerCase();
    if (lowerPath.endsWith('.tar.gz')) return createContentType('application/gzip');
    if (lowerPath.endsWith('.tar.bz2')) return createContentType('application/x-bzip2');
    if (lowerPath.endsWith('.tar.xz')) return createContentType('application/x-xz');

    // 拡張子を取得（大文字小文字を区別しない）
    const extension = path.split('.').pop()?.toLowerCase();

    const extensionMap: Record<string, string> = {
      json: 'application/json',
      xml: 'application/xml',
      csv: 'text/csv',
      txt: 'text/plain',
      pdf: 'application/pdf',
      html: 'text/html',
      htm: 'text/html',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    const contentType =
      extension && extensionMap[extension] ? extensionMap[extension] : 'application/octet-stream';

    return createContentType(contentType);
  }
}
