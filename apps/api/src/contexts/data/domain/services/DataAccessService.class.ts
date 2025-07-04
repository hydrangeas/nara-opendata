import { injectable } from 'tsyringe';
import { createFilePath } from '../value-objects/FilePath';
import type { ContentType } from '../value-objects/ContentType';
import { createContentType } from '../value-objects/ContentType';
import type { OpenDataResource } from '../value-objects/OpenDataResource';
import { isResourceAccessible } from '../value-objects/OpenDataResource';

/**
 * データアクセスのビジネスロジックを提供するドメインサービス（クラス版）
 *
 * @remarks
 * DIコンテナで使用するためにインスタンスメソッドとして実装
 * 元の静的メソッド版と同じインターフェースを提供
 */
@injectable()
export class DataAccessServiceClass {
  // デフォルトの最大ファイルサイズ（100MB）
  // TODO: 将来的にプロジェクト固有の設定として外部化を検討
  private readonly DEFAULT_MAX_FILE_SIZE = 100 * 1024 * 1024;

  constructor() {}

  /**
   * リソースパスを検証する
   * @throws {PathTraversalException} パストラバーサルが検出された場合
   */
  validateResourcePath(path: string): void {
    // createFilePathの検証を利用
    createFilePath(path);
  }

  /**
   * リソースへのアクセスを検証する
   */
  validateAccess(
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
  buildResourcePath(basePath: string, filePath: string): string {
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
  getContentTypeFromPath(path: string): ContentType {
    // 複合拡張子を先にチェック
    const lowerPath = path.toLowerCase();
    if (lowerPath.endsWith('.tar.gz')) return createContentType('application/gzip');
    if (lowerPath.endsWith('.tar.bz2')) return createContentType('application/x-bzip2');
    if (lowerPath.endsWith('.tar.xz')) return createContentType('application/x-xz');

    // 拡張子を取得（大文字小文字を区別しない）
    const extension = path.split('.').pop()?.toLowerCase();

    // TODO: 拡張子とMIMEタイプのマッピングの外部化を検討
    // 将来的に設定ファイルや設定クラスから提供される可能性あり
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
      zip: 'application/zip',
      gz: 'application/gzip',
      bz2: 'application/x-bzip2',
      xz: 'application/x-xz',
    };

    const contentType =
      extension && extensionMap[extension] ? extensionMap[extension] : 'application/octet-stream';

    return createContentType(contentType);
  }
}
