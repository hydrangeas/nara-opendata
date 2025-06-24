import type { APIEndpoint } from '../value-objects';

/**
 * APIエンドポイントリポジトリのインターフェース
 */
export interface IAPIEndpointRepository {
  /**
   * パスに対応するAPIエンドポイントを検索する
   * @param path APIパス
   * @returns 見つかった場合はAPIEndpoint、見つからない場合はnull
   */
  findByPath(path: string): Promise<APIEndpoint | null>;

  /**
   * すべてのAPIエンドポイントを取得する
   * @returns APIエンドポイントの配列
   */
  listAll(): Promise<APIEndpoint[]>;
}
