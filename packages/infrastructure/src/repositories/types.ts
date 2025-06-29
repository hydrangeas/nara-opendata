/**
 * インフラストラクチャ層で使用する型定義
 *
 * ドメイン層からの循環参照を避けるため、必要な型をここで定義
 */

/**
 * ファイルパスを表す型
 */
export interface IFilePath {
  value: string;
}

/**
 * コンテンツタイプを表す型
 */
export interface IContentType {
  value: string;
}

/**
 * ファイルサイズを表す型
 */
export interface IFileSize {
  bytes: number;
}

/**
 * オープンデータリソースを表す型
 */
export interface IOpenDataResource {
  path: IFilePath;
  contentType: IContentType;
  fileSize?: IFileSize;
}

/**
 * オープンデータリポジトリのインターフェース
 */
export interface IOpenDataRepository {
  findByPath(path: IFilePath): Promise<IOpenDataResource | null>;
  exists(path: IFilePath): Promise<boolean>;
  getContent(resource: IOpenDataResource): Promise<Buffer>;
  listByPathPrefix(
    pathPrefix: string,
    options?: {
      maxResults?: number;
      contentTypes?: string[];
    },
  ): Promise<IOpenDataResource[]>;
}
