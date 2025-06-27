import { describe, expect, it } from 'vitest';
import { DomainException } from './DomainException';
import type { DomainError } from '../types/DomainError';
import { createDomainError } from '../types/DomainError';
import { ErrorType } from '../types/ErrorType';

// テスト用の具体的なDomainException実装
class TestDomainException extends DomainException {
  readonly domainError: DomainError;

  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message);
    this.domainError = createDomainError(code, message, ErrorType.Business, details);
  }
}

describe('DomainException', () => {
  it('基本的な例外を作成できる', () => {
    const exception = new TestDomainException('Test error', 'TEST_ERROR');

    expect(exception.message).toBe('Test error');
    expect(exception.name).toBe('TestDomainException');
    expect(exception.code).toBe('TEST_ERROR');
    expect(exception.details).toBeUndefined();
  });

  it('詳細情報付きの例外を作成できる', () => {
    const details = { field: 'test', value: 42 };
    const exception = new TestDomainException('Test error', 'TEST_ERROR', details);

    expect(exception.details).toEqual(details);
  });

  it('Errorクラスを正しく継承している', () => {
    const exception = new TestDomainException('Test error', 'TEST_ERROR');

    expect(exception).toBeInstanceOf(Error);
    expect(exception).toBeInstanceOf(DomainException);
    expect(exception).toBeInstanceOf(TestDomainException);
  });

  it('スタックトレースを持つ', () => {
    const exception = new TestDomainException('Test error', 'TEST_ERROR');

    expect(exception.stack).toBeDefined();
    expect(exception.stack).toContain('TestDomainException');
  });

  it('toJSONメソッドで構造化されたエラー情報を返す', () => {
    const details = { userId: '123', action: 'delete' };
    const exception = new TestDomainException('Permission denied', 'PERMISSION_ERROR', details);

    const json = exception.toJSON();

    expect(json).toEqual({
      name: 'TestDomainException',
      code: 'PERMISSION_ERROR',
      message: 'Permission denied',
      type: ErrorType.Business,
      details: details,
    });
  });

  it('詳細情報がない場合のtoJSON', () => {
    const exception = new TestDomainException('Simple error', 'SIMPLE_ERROR');

    const json = exception.toJSON();

    expect(json).toEqual({
      name: 'TestDomainException',
      code: 'SIMPLE_ERROR',
      message: 'Simple error',
      type: ErrorType.Business,
      details: undefined,
    });
  });

  it('プロトタイプチェーンが正しく設定される', () => {
    const exception = new TestDomainException('Test error', 'TEST_ERROR');

    // instanceofが正しく動作することを確認
    expect(exception instanceof TestDomainException).toBe(true);
    expect(exception instanceof DomainException).toBe(true);
    expect(exception instanceof Error).toBe(true);

    // プロトタイプが正しく設定されていることを確認
    expect(Object.getPrototypeOf(exception)).toBe(TestDomainException.prototype);
  });

  it('異なるDomainException実装が独立している', () => {
    class AnotherTestException extends DomainException {
      readonly domainError: DomainError;

      constructor(message: string) {
        super(message);
        this.domainError = createDomainError('ANOTHER_ERROR', message, ErrorType.Validation);
      }
    }

    const exception1 = new TestDomainException('Error 1', 'ERROR_1');
    const exception2 = new AnotherTestException('Error 2');

    expect(exception1.name).toBe('TestDomainException');
    expect(exception2.name).toBe('AnotherTestException');
    expect(exception1.code).toBe('ERROR_1');
    expect(exception2.code).toBe('ANOTHER_ERROR');
    expect(exception1.domainError.type).toBe(ErrorType.Business);
    expect(exception2.domainError.type).toBe(ErrorType.Validation);
  });
});
