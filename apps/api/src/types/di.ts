/**
 * DIコンテナ用の型定義
 *
 * このファイルはDIコンテナで使用される識別子の型安全性を提供します。
 * シンボルを使用することで、文字列の重複や誤字を防ぎます。
 */

/**
 * DIコンテナの識別子定義
 *
 * @remarks
 * - Symbolを使用して一意性を保証
 * - 各識別子は対応するインターフェースを表す
 * - テスト時はこれらの識別子を使用してモックを注入
 */
export const TYPES = {
  // Repository interfaces
  IOpenDataRepository: Symbol.for('IOpenDataRepository'),
  IRateLimitRepository: Symbol.for('IRateLimitRepository'),
  IAPILogRepository: Symbol.for('IAPILogRepository'),
  IAuthLogRepository: Symbol.for('IAuthLogRepository'),
  IAPIEndpointRepository: Symbol.for('IAPIEndpointRepository'),

  // Domain services
  AuthenticationService: Symbol.for('AuthenticationService'),
  APIAccessControlService: Symbol.for('APIAccessControlService'),
  DataAccessService: Symbol.for('DataAccessService'),
  LogAnalysisService: Symbol.for('LogAnalysisService'),

  // Infrastructure services
  IEventBus: Symbol.for('IEventBus'),
  ILogger: Symbol.for('ILogger'),

  // External services
  SupabaseClient: Symbol.for('SupabaseClient'),
} as const;

/**
 * TYPES オブジェクトの値の型
 */
export type DIToken = (typeof TYPES)[keyof typeof TYPES];

/**
 * カスタムバインディングの型定義
 *
 * @remarks
 * DIコンテナに登録するカスタム実装の設定
 */
export interface ICustomBinding {
  token: DIToken;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useClass?: new (...args: any[]) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useValue?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useFactory?: () => any;
}

/**
 * DIコンテナの設定オプション
 */
export interface IDIContainerConfig {
  /**
   * テストモードかどうか
   *
   * @remarks
   * テストモードの場合、モックサービスが自動的に登録される
   */
  isTestMode?: boolean;

  /**
   * カスタムバインディング
   *
   * @remarks
   * 特定のトークンに対してカスタム実装を登録する場合に使用
   */
  customBindings?: ICustomBinding[];
}
