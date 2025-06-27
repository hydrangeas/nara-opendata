import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { RateLimitException } from './RateLimitException';
import { DomainException } from './DomainException';
import { ErrorType } from '../types/ErrorType';

describe('RateLimitException', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('基本的なレート制限例外を作成できる', () => {
    const exception = new RateLimitException('Rate limit exceeded');

    expect(exception.message).toBe('Rate limit exceeded');
    expect(exception.name).toBe('RateLimitException');
    expect(exception.code).toBe('RATE_LIMIT_ERROR');
    expect(exception.domainError.type).toBe(ErrorType.RateLimit);
  });

  it('リトライ時刻を含む例外を作成できる', () => {
    const retryAfter = new Date('2024-01-01T12:30:00Z');
    const exception = new RateLimitException('Too many requests', retryAfter);

    expect(exception.message).toBe('Too many requests');
    expect(exception.retryAfter).toBe(retryAfter);
    expect(exception.domainError.details?.['retryAfter']).toBe('2024-01-01T12:30:00.000Z');
  });

  it('詳細情報付きの例外を作成できる', () => {
    const retryAfter = new Date('2024-01-01T12:30:00Z');
    const details = {
      limit: 100,
      window: '1 minute',
      currentCount: 101,
    };

    const exception = new RateLimitException('API rate limit exceeded', retryAfter, details);

    expect(exception.domainError.details).toMatchObject({
      retryAfter: '2024-01-01T12:30:00.000Z',
      ...details,
    });
  });

  it('リトライ時刻なしで例外を作成できる', () => {
    const exception = new RateLimitException('Rate limit exceeded');

    expect(exception.retryAfter).toBeUndefined();
    expect(exception.domainError.details?.['retryAfter']).toBeUndefined();
  });

  it('DomainExceptionを継承している', () => {
    const exception = new RateLimitException('Test');

    expect(exception).toBeInstanceOf(RateLimitException);
    expect(exception).toBeInstanceOf(DomainException);
    expect(exception).toBeInstanceOf(Error);
  });

  it('toJSONで構造化されたエラー情報を返す', () => {
    const retryAfter = new Date('2024-01-01T12:30:00Z');
    const details = { endpoint: '/api/data' };
    const exception = new RateLimitException('Rate limit exceeded', retryAfter, details);

    const json = exception.toJSON();

    expect(json).toEqual({
      name: 'RateLimitException',
      code: 'RATE_LIMIT_ERROR',
      message: 'Rate limit exceeded',
      type: ErrorType.RateLimit,
      details: {
        retryAfter: '2024-01-01T12:30:00.000Z',
        endpoint: '/api/data',
      },
    });
  });

  it('スタックトレースを持つ', () => {
    const exception = new RateLimitException('Test error');

    expect(exception.stack).toBeDefined();
    expect(exception.stack).toContain('RateLimitException');
  });
});
