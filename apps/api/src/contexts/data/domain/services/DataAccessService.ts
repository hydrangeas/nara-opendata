import type { ContentType } from '../value-objects/ContentType';
import type { OpenDataResource } from '../value-objects/OpenDataResource';
import { DataAccessServiceClass } from './DataAccessService.class';

/**
 * データアクセスのビジネスロジックを提供するドメインサービス
 *
 * @deprecated 新規コードではDataAccessServiceClassを使用してください。
 * このクラスは後方互換性のために保持されています。
 */
export class DataAccessService {
  private static readonly instance = new DataAccessServiceClass();

  /**
   * リソースパスを検証する
   * @throws {PathTraversalException} パストラバーサルが検出された場合
   */
  static validateResourcePath(path: string): void {
    return this.instance.validateResourcePath(path);
  }

  /**
   * リソースへのアクセスを検証する
   */
  static validateAccess(
    resource: OpenDataResource,
    options: { maxFileSizeBytes?: number } = {},
  ): { allowed: boolean; reason?: string } {
    return this.instance.validateAccess(resource, options);
  }

  /**
   * ベースパスとファイルパスを結合する
   */
  static buildResourcePath(basePath: string, filePath: string): string {
    return this.instance.buildResourcePath(basePath, filePath);
  }

  /**
   * ファイルパスから適切なコンテンツタイプを推測する
   */
  static getContentTypeFromPath(path: string): ContentType {
    return this.instance.getContentTypeFromPath(path);
  }
}

// Re-export the class-based version for DI
export { DataAccessServiceClass } from './DataAccessService.class';
