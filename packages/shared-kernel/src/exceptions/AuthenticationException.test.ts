import { describe, expect, it } from 'vitest';
import { AuthenticationException } from './AuthenticationException';
import { DomainException } from './DomainException';
import { ErrorType } from '../types/ErrorType';

describe('AuthenticationException', () => {
  it('基本的な認証例外を作成できる', () => {
    const exception = new AuthenticationException('Authentication failed');

    expect(exception.message).toBe('Authentication failed');
    expect(exception.name).toBe('AuthenticationException');
    expect(exception.code).toBe('AUTH_ERROR');
    expect(exception.domainError.type).toBe(ErrorType.Unauthorized);
  });

  it('詳細情報付きの認証例外を作成できる', () => {
    const details = {
      attemptedUsername: 'john@example.com',
      ipAddress: '192.168.1.1',
      timestamp: new Date().toISOString(),
    };

    const exception = new AuthenticationException('Invalid credentials', details);

    expect(exception.message).toBe('Invalid credentials');
    expect(exception.details).toEqual(details);
  });

  it('DomainExceptionを継承している', () => {
    const exception = new AuthenticationException('Test');

    expect(exception).toBeInstanceOf(AuthenticationException);
    expect(exception).toBeInstanceOf(DomainException);
    expect(exception).toBeInstanceOf(Error);
  });

  describe('static factory methods', () => {
    it('invalidCredentialsで無効な認証情報の例外を作成できる', () => {
      const exception = AuthenticationException.invalidCredentials();

      expect(exception.message).toBe('Invalid credentials');
      expect(exception.code).toBe('AUTH_ERROR');
      expect(exception.domainError.type).toBe(ErrorType.Unauthorized);
    });

    it('tokenExpiredでトークン期限切れの例外を作成できる', () => {
      const exception = AuthenticationException.tokenExpired();

      expect(exception.message).toBe('Authentication token has expired');
      expect(exception.code).toBe('AUTH_ERROR');
    });

    it('invalidTokenで無効なトークンの例外を作成できる', () => {
      const exception = AuthenticationException.invalidToken();

      expect(exception.message).toBe('Invalid authentication token');
      expect(exception.code).toBe('AUTH_ERROR');
    });

    it('authenticationRequiredで認証が必要な例外を作成できる', () => {
      const exception = AuthenticationException.authenticationRequired();

      expect(exception.message).toBe('Authentication is required');
      expect(exception.code).toBe('AUTH_ERROR');
    });
  });

  it('toJSONで構造化されたエラー情報を返す', () => {
    const details = { provider: 'google', reason: 'token_invalid' };
    const exception = new AuthenticationException('Google auth failed', details);

    const json = exception.toJSON();

    expect(json).toEqual({
      name: 'AuthenticationException',
      code: 'AUTH_ERROR',
      message: 'Google auth failed',
      type: ErrorType.Unauthorized,
      details: details,
    });
  });

  it('スタックトレースを持つ', () => {
    const exception = new AuthenticationException('Test error');

    expect(exception.stack).toBeDefined();
    expect(exception.stack).toContain('AuthenticationException');
  });
});
