import type { DomainError } from '../types/DomainError';

/**
 * ドメイン例外の抽象基底クラス
 */
export abstract class DomainException extends Error {
  /**
   * ドメインエラー情報
   */
  abstract readonly domainError: DomainError;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;

    // プロトタイプチェーンの修正（TypeScriptでErrorを継承する際に必要）
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * エラーコードを取得する
   */
  get code(): string {
    return this.domainError.code;
  }

  /**
   * エラーの詳細情報を取得する
   */
  get details(): Record<string, unknown> | undefined {
    return this.domainError.details;
  }

  /**
   * 構造化されたエラー情報を返す
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      type: this.domainError.type,
      details: this.details,
    };
  }
}
