import { PathTraversalException } from '../exceptions/PathTraversalException';

/**
 * ファイルパスを表すバリューオブジェクト
 * パストラバーサル攻撃を防ぐための検証を含む
 */
export interface IFilePathAttributes {
  value: string;
}

export type FilePath = IFilePathAttributes & { readonly brand: unique symbol };

/**
 * ファイルパスを作成する
 * @throws {PathTraversalException} パストラバーサルが検出された場合
 */
export function createFilePath(path: string): FilePath {
  // 空文字チェック
  if (!path || path.trim() === '') {
    throw new Error('File path cannot be empty');
  }

  // パストラバーサルのパターンを検出
  const traversalPatterns = [
    /\.\./g, // 親ディレクトリへの参照
    /\.\.%2F/gi, // URLエンコードされた ../
    /\.\.%252F/gi, // ダブルエンコードされた ../
    /\.\.%5C/gi, // URLエンコードされた ..\
    /\.\.%255C/gi, // ダブルエンコードされた ..\
    /\.\.\\/, // Windows形式の親ディレクトリ参照
    /^\//, // 絶対パス（ルートから開始）
    /^[A-Za-z]:/, // Windows形式の絶対パス
    /\0/, // nullバイト
  ];

  for (const pattern of traversalPatterns) {
    if (pattern.test(path)) {
      throw new PathTraversalException(path);
    }
  }

  // 正規化：連続するスラッシュを単一に
  const normalizedPath = path.replace(/\/+/g, '/').trim();

  // 許可される文字のみで構成されているかチェック
  // 英数字、ハイフン、アンダースコア、ドット、スラッシュのみ許可
  const allowedPattern = /^[a-zA-Z0-9._\-\/]+$/;
  if (!allowedPattern.test(normalizedPath)) {
    throw new Error(`Invalid characters in file path: ${path}`);
  }

  return { value: normalizedPath } as FilePath;
}

/**
 * FilePathから文字列値を取得する
 */
export function getFilePathValue(filePath: FilePath): string {
  return filePath.value;
}

/**
 * FilePathの等価性を判定する
 */
export function equalsFilePath(a: FilePath, b: FilePath): boolean {
  return a.value === b.value;
}

/**
 * URLパスからファイルシステムパスに変換する
 * 例: "/secure/319985/r5.json" -> "secure/319985/r5.json"
 */
export function convertUrlPathToFilePath(urlPath: string): FilePath {
  // 先頭のスラッシュを削除
  const pathWithoutLeadingSlash = urlPath.replace(/^\/+/, '');
  return createFilePath(pathWithoutLeadingSlash);
}
