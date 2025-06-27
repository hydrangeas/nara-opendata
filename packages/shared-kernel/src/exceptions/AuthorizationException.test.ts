import { describe, expect, it } from 'vitest';
import { AuthorizationException } from './AuthorizationException';
import { DomainException } from './DomainException';
import { ErrorType } from '../types/ErrorType';

describe('AuthorizationException', () => {
  it('基本的な認可例外を作成できる', () => {
    const exception = new AuthorizationException('Access denied');

    expect(exception.message).toBe('Access denied');
    expect(exception.name).toBe('AuthorizationException');
    expect(exception.code).toBe('AUTHZ_ERROR');
    expect(exception.domainError.type).toBe(ErrorType.Unauthorized);
  });

  it('詳細情報付きの認可例外を作成できる', () => {
    const details = {
      requiredRole: 'admin',
      userRole: 'user',
      resource: '/admin/users',
    };

    const exception = new AuthorizationException('Insufficient permissions', details);

    expect(exception.message).toBe('Insufficient permissions');
    expect(exception.details).toEqual(details);
  });

  it('DomainExceptionを継承している', () => {
    const exception = new AuthorizationException('Test');

    expect(exception).toBeInstanceOf(AuthorizationException);
    expect(exception).toBeInstanceOf(DomainException);
    expect(exception).toBeInstanceOf(Error);
  });

  it('toJSONで構造化されたエラー情報を返す', () => {
    const details = { action: 'delete', resource: 'document' };
    const exception = new AuthorizationException('Permission denied', details);

    const json = exception.toJSON();

    expect(json).toEqual({
      name: 'AuthorizationException',
      code: 'AUTHZ_ERROR',
      message: 'Permission denied',
      type: ErrorType.Unauthorized,
      details: details,
    });
  });

  it('スタックトレースを持つ', () => {
    const exception = new AuthorizationException('Test error');

    expect(exception.stack).toBeDefined();
    expect(exception.stack).toContain('AuthorizationException');
  });
});
