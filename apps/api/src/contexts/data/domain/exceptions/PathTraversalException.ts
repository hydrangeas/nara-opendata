/**
 * パストラバーサル攻撃を検出した際にスローされる例外
 */
export class PathTraversalException extends Error {
  constructor(
    public readonly attemptedPath: string,
    message?: string,
  ) {
    super(message || `Path traversal attempt detected: ${attemptedPath}`);
    this.name = 'PathTraversalException';
    Object.setPrototypeOf(this, PathTraversalException.prototype);
  }
}
