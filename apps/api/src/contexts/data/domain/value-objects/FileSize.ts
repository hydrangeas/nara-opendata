/**
 * ファイルサイズを表すバリューオブジェクト
 */
export interface IFileSizeAttributes {
  bytes: number;
}

export type FileSize = IFileSizeAttributes & { readonly brand: unique symbol };

/**
 * ファイルサイズを作成する
 */
export function createFileSize(bytes: number): FileSize {
  // 負の値チェック
  if (bytes < 0) {
    throw new Error('File size cannot be negative');
  }

  // 整数チェック
  if (!Number.isInteger(bytes)) {
    throw new Error('File size must be an integer');
  }

  // 最大値チェック（JavaScriptの安全な整数の範囲内）
  if (bytes > Number.MAX_SAFE_INTEGER) {
    throw new Error('File size exceeds maximum safe integer');
  }

  return { bytes } as FileSize;
}

/**
 * FileSizeからバイト数を取得する
 */
export function getFileSizeBytes(fileSize: FileSize): number {
  return fileSize.bytes;
}

/**
 * FileSizeの等価性を判定する
 */
export function equalsFileSize(a: FileSize, b: FileSize): boolean {
  return a.bytes === b.bytes;
}

/**
 * ファイルサイズを人間が読みやすい形式にフォーマットする
 */
export function formatFileSize(fileSize: FileSize, precision = 2): string {
  const bytes = fileSize.bytes;

  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const base = 1024;

  // 適切な単位を見つける
  let unitIndex = 0;
  let size = bytes;

  while (size >= base && unitIndex < units.length - 1) {
    size /= base;
    unitIndex++;
  }

  // 最初の単位（B）の場合は小数点なし
  if (unitIndex === 0) {
    return `${bytes} ${units[0]}`;
  }

  // その他の単位では指定された精度で表示
  return `${size.toFixed(precision)} ${units[unitIndex]}`;
}

/**
 * ファイルサイズが指定された最大サイズ以下かチェックする
 */
export function isValidFileSize(fileSize: FileSize, maxBytes?: number): boolean {
  if (maxBytes === undefined) {
    return true;
  }

  return fileSize.bytes <= maxBytes;
}
