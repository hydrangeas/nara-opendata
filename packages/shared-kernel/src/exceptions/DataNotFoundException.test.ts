import { describe, expect, it } from 'vitest';
import { DataNotFoundException } from './DataNotFoundException';
import { DomainException } from './DomainException';
import { ErrorType } from '../types/ErrorType';

describe('DataNotFoundException', () => {
  it('基本的なデータ未発見例外を作成できる', () => {
    const exception = new DataNotFoundException('Data not found');

    expect(exception.message).toBe('Data not found');
    expect(exception.name).toBe('DataNotFoundException');
    expect(exception.code).toBe('DATA_NOT_FOUND');
    expect(exception.domainError.type).toBe(ErrorType.NotFound);
  });

  it('リソースタイプとIDを含む例外を作成できる', () => {
    const exception = new DataNotFoundException('User not found', 'User', 'user-123');

    expect(exception.message).toBe('User not found');
    expect(exception.resourceType).toBe('User');
    expect(exception.resourceId).toBe('user-123');
    expect(exception.domainError.details).toEqual({
      resourceType: 'User',
      resourceId: 'user-123',
    });
  });

  it('詳細情報付きの例外を作成できる', () => {
    const additionalDetails = {
      searchCriteria: { email: 'test@example.com' },
      timestamp: new Date().toISOString(),
    };

    const exception = new DataNotFoundException(
      'User not found',
      'User',
      undefined,
      additionalDetails,
    );

    expect(exception.domainError.details).toMatchObject({
      resourceType: 'User',
      ...additionalDetails,
    });
  });

  it('リソースタイプのみを指定できる', () => {
    const exception = new DataNotFoundException('File not found', 'File');

    expect(exception.resourceType).toBe('File');
    expect(exception.resourceId).toBeUndefined();
    expect(exception.domainError.details?.['resourceType']).toBe('File');
    expect(exception.domainError.details?.['resourceId']).toBeUndefined();
  });

  it('DomainExceptionを継承している', () => {
    const exception = new DataNotFoundException('Test');

    expect(exception).toBeInstanceOf(DataNotFoundException);
    expect(exception).toBeInstanceOf(DomainException);
    expect(exception).toBeInstanceOf(Error);
  });

  it('toJSONで構造化されたエラー情報を返す', () => {
    const exception = new DataNotFoundException('Document not found', 'Document', 'doc-456', {
      path: '/documents/doc-456',
    });

    const json = exception.toJSON();

    expect(json).toEqual({
      name: 'DataNotFoundException',
      code: 'DATA_NOT_FOUND',
      message: 'Document not found',
      type: ErrorType.NotFound,
      details: {
        resourceType: 'Document',
        resourceId: 'doc-456',
        path: '/documents/doc-456',
      },
    });
  });

  it('スタックトレースを持つ', () => {
    const exception = new DataNotFoundException('Test error');

    expect(exception.stack).toBeDefined();
    expect(exception.stack).toContain('DataNotFoundException');
  });
});
