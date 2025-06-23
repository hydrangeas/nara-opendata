import type { OpenDataResource } from '../value-objects/OpenDataResource';
import type { FilePath } from '../value-objects/FilePath';

/**
 * オープンデータの永続化を抽象化するリポジトリインターフェース
 */
export interface IOpenDataRepository {
  /**
   * ファイルパスに対応するリソースを取得する
   * @param path ファイルパス
   * @returns リソースが存在する場合はOpenDataResource、存在しない場合はnull
   */
  findByPath(path: FilePath): Promise<OpenDataResource | null>;

  /**
   * リソースが存在するかチェックする
   * @param path ファイルパス
   * @returns 存在する場合はtrue
   */
  exists(path: FilePath): Promise<boolean>;

  /**
   * リソースのコンテンツを取得する
   * @param resource オープンデータリソース
   * @returns ファイルのコンテンツをBufferとして返す
   * @throws {Error} リソースが存在しない場合
   */
  getContent(resource: OpenDataResource): Promise<Buffer>;

  /**
   * 指定されたパスプレフィックスに一致するリソースを列挙する
   * @param pathPrefix パスのプレフィックス（例: "secure/319985/"）
   * @param options オプション
   * @returns 一致するリソースの配列
   */
  listByPathPrefix(
    pathPrefix: string,
    options?: {
      maxResults?: number;
      contentTypes?: string[];
    },
  ): Promise<OpenDataResource[]>;
}
