import { DomainException } from './DomainException';
import type { DomainError } from '../types/DomainError';
import { createDomainError } from '../types/DomainError';
import { ErrorType } from '../types/ErrorType';

/**
 * 認可例外
 */
export class AuthorizationException extends DomainException {
  readonly domainError: DomainError;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.domainError = createDomainError('AUTHZ_ERROR', message, ErrorType.Unauthorized, details);
  }

  /**
   * 権限不足の例外を作成
   */
  static insufficientPermissions(requiredPermission?: string): AuthorizationException {
    const message = requiredPermission
      ? `Insufficient permissions. Required: ${requiredPermission}`
      : 'Insufficient permissions to perform this action';

    return new AuthorizationException(message, {
      requiredPermission,
    });
  }

  /**
   * リソースアクセス拒否の例外を作成
   */
  static accessDenied(resource?: string): AuthorizationException {
    const message = resource ? `Access denied to resource: ${resource}` : 'Access denied';

    return new AuthorizationException(message, {
      resource,
    });
  }

  /**
   * ロール不足の例外を作成
   */
  static roleRequired(requiredRole: string): AuthorizationException {
    return new AuthorizationException(`Required role: ${requiredRole}`, { requiredRole });
  }
}
