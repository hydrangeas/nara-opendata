import 'reflect-metadata';
import { promises as fs } from 'fs';
import * as path from 'path';
import { injectable } from 'tsyringe';
import type { IOpenDataRepository, IOpenDataResource, IFilePath, IContentType } from './types';

/**
 * ファイルシステムベースのOpenDataRepositoryの実装
 */
@injectable()
export class OpenDataRepositoryImpl implements IOpenDataRepository {
  private readonly baseDir: string;

  constructor() {
    // 環境変数からベースディレクトリを取得、デフォルトは./data
    this.baseDir = process.env['DATA_DIR'] || './data';
  }

  /**
   * ファイルパスに対応するリソースを取得する
   */
  async findByPath(filePath: IFilePath): Promise<IOpenDataResource | null> {
    const fullPath = this.buildFullPath(filePath);

    try {
      const stats = await fs.stat(fullPath);

      if (!stats.isFile()) {
        return null;
      }

      // ファイル情報からリソースを作成
      return this.createResource(filePath.value, stats.size);
    } catch (error) {
      // ファイルが存在しない場合はnullを返す
      if (this.isFileNotFoundError(error)) {
        return null;
      }
      // その他のエラーは再スロー
      throw error;
    }
  }

  /**
   * リソースが存在するかチェックする
   */
  async exists(filePath: IFilePath): Promise<boolean> {
    const fullPath = this.buildFullPath(filePath);

    try {
      const stats = await fs.stat(fullPath);
      return stats.isFile();
    } catch {
      return false;
    }
  }

  /**
   * リソースのコンテンツを取得する
   */
  async getContent(resource: IOpenDataResource): Promise<Buffer> {
    const fullPath = this.buildFullPath(resource.path);

    try {
      return await fs.readFile(fullPath);
    } catch (error) {
      if (this.isFileNotFoundError(error)) {
        throw new Error(`Resource not found: ${resource.path.value}`);
      }
      throw error;
    }
  }

  /**
   * 指定されたパスプレフィックスに一致するリソースを列挙する
   */
  async listByPathPrefix(
    pathPrefix: string,
    options?: {
      maxResults?: number;
      contentTypes?: string[];
    },
  ): Promise<IOpenDataResource[]> {
    const results: IOpenDataResource[] = [];
    const maxResults = options?.maxResults || 100;

    // プレフィックスのディレクトリを構築
    const searchDir = path.join(this.baseDir, pathPrefix);

    try {
      const walkOptions: {
        maxResults: number;
        contentTypes?: string[];
      } = {
        maxResults,
      };

      if (options?.contentTypes !== undefined) {
        walkOptions.contentTypes = options.contentTypes;
      }

      await this.walkDirectory(searchDir, pathPrefix, results, walkOptions);
    } catch (error) {
      // ディレクトリが存在しない場合は空の配列を返す
      if (this.isFileNotFoundError(error)) {
        return [];
      }
      throw error;
    }

    return results;
  }

  /**
   * ベースディレクトリとファイルパスから完全なパスを構築する
   */
  private buildFullPath(filePath: IFilePath): string {
    return path.join(this.baseDir, filePath.value);
  }

  /**
   * リソースを作成する
   */
  private createResource(pathValue: string, sizeBytes: number): IOpenDataResource {
    return {
      path: { value: pathValue },
      contentType: this.getContentTypeFromPath(pathValue),
      fileSize: { bytes: sizeBytes },
    };
  }

  /**
   * ファイルパスからコンテンツタイプを推測する
   */
  private getContentTypeFromPath(pathValue: string): IContentType {
    // 複合拡張子を先にチェック
    const lowerPath = pathValue.toLowerCase();
    if (lowerPath.endsWith('.tar.gz')) return { value: 'application/gzip' };
    if (lowerPath.endsWith('.tar.bz2')) return { value: 'application/x-bzip2' };
    if (lowerPath.endsWith('.tar.xz')) return { value: 'application/x-xz' };

    // 拡張子を取得（大文字小文字を区別しない）
    const extension = pathValue.split('.').pop()?.toLowerCase();

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

    return { value: contentType };
  }

  /**
   * ディレクトリを再帰的に走査してファイルを収集する
   */
  private async walkDirectory(
    dir: string,
    basePrefix: string,
    results: IOpenDataResource[],
    options: {
      maxResults: number;
      contentTypes?: string[];
    },
  ): Promise<void> {
    // 結果数が上限に達した場合は終了
    if (results.length >= options.maxResults) {
      return;
    }

    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (results.length >= options.maxResults) {
        break;
      }

      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // サブディレクトリを再帰的に探索
        await this.walkDirectory(fullPath, basePrefix, results, options);
      } else if (entry.isFile()) {
        // 相対パスを計算
        const relativePath = path.relative(this.baseDir, fullPath);
        const normalizedPath = relativePath.replace(/\\/g, '/'); // Windows対応

        try {
          const stats = await fs.stat(fullPath);
          const resource = this.createResource(normalizedPath, stats.size);

          // コンテンツタイプのフィルタリング
          if (options.contentTypes && options.contentTypes.length > 0) {
            const contentType = resource.contentType.value;
            if (!options.contentTypes.includes(contentType)) {
              continue;
            }
          }

          results.push(resource);
        } catch {
          // 個別ファイルのエラーは無視して継続
          continue;
        }
      }
    }
  }

  /**
   * エラーがファイルが見つからないエラーかどうかを判定する
   */
  private isFileNotFoundError(error: unknown): boolean {
    return (
      error instanceof Error &&
      'code' in error &&
      (error as NodeJS.ErrnoException).code === 'ENOENT'
    );
  }
}
