import { DomainException } from './DomainException';
import type { DomainError } from '../types/DomainError';
import { createDomainError } from '../types/DomainError';
import { ErrorType } from '../types/ErrorType';

/**
 * 認証例外
 */
export class AuthenticationException extends DomainException {
  readonly domainError: DomainError;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.domainError = createDomainError('AUTH_ERROR', message, ErrorType.Unauthorized, details);
  }

  /**
   * 無効な認証情報の例外を作成
   */
  static invalidCredentials(): AuthenticationException {
    return new AuthenticationException('Invalid credentials');
  }

  /**
   * トークン期限切れの例外を作成
   */
  static tokenExpired(): AuthenticationException {
    return new AuthenticationException('Authentication token has expired');
  }

  /**
   * トークン無効の例外を作成
   */
  static invalidToken(): AuthenticationException {
    return new AuthenticationException('Invalid authentication token');
  }

  /**
   * 認証が必要な例外を作成
   */
  static authenticationRequired(): AuthenticationException {
    return new AuthenticationException('Authentication is required');
  }
}
