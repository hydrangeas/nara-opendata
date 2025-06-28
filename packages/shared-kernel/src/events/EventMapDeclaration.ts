/**
 * アプリケーション固有のドメインイベントマップ定義
 *
 * このファイルでDomainEventMapインターフェースを拡張し、
 * 型安全なイベントバスを実現します。
 */

import type { UserAuthenticated } from './UserAuthenticated';
import type { TokenRefreshed } from './TokenRefreshed';
import type { UserLoggedOut } from './UserLoggedOut';
import type { APIAccessed } from './APIAccessed';
import type { RateLimitExceeded } from './RateLimitExceeded';
import type { DataRetrieved } from './DataRetrieved';
import type { AuthenticationFailed } from './AuthenticationFailed';

declare module './DomainEventMap' {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface DomainEventMap {
    UserAuthenticated: UserAuthenticated;
    TokenRefreshed: TokenRefreshed;
    UserLoggedOut: UserLoggedOut;
    APIAccessed: APIAccessed;
    RateLimitExceeded: RateLimitExceeded;
    DataRetrieved: DataRetrieved;
    AuthenticationFailed: AuthenticationFailed;
  }
}
