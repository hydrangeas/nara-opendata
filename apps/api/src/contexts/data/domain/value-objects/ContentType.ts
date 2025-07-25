/**
 * コンテンツタイプ（MIMEタイプ）を表すバリューオブジェクト
 */
export interface IContentTypeAttributes {
  value: string;
}

export type ContentType = IContentTypeAttributes & { readonly brand: unique symbol };

/**
 * コンテンツタイプを作成する
 */
export function createContentType(mimeType: string): ContentType {
  // 空文字チェック
  if (!mimeType || mimeType.trim() === '') {
    throw new Error('Content type cannot be empty');
  }

  // 前後の空白を削除して小文字に正規化
  const normalizedType = mimeType.trim().toLowerCase();

  // 基本的なMIMEタイプフォーマットを検証
  // RFC 6838に準拠: type/subtype[+suffix][; parameters]

  // メインのtype/subtypeとパラメータを分離
  const [mainType, ...params] = normalizedType.split(';');

  // type/subtype[+suffix]の検証
  const typeSubtypePattern =
    /^[a-zA-Z0-9][a-zA-Z0-9!#$&^_+.-]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&^_+.-]*(\+[a-zA-Z0-9][a-zA-Z0-9!#$&^_+.-]*)?$/;
  if (!mainType || !typeSubtypePattern.test(mainType.trim())) {
    throw new Error(`Invalid MIME type format: ${mimeType}`);
  }

  // パラメータの検証（存在する場合）
  if (params.length > 0) {
    const paramPattern = /^\s*[a-zA-Z0-9-]+=?[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=%]*$/;
    for (const param of params) {
      // 空のパラメータは無効
      if (param.trim() === '') {
        throw new Error(`Invalid MIME type format: ${mimeType}`);
      }
      if (!paramPattern.test(param)) {
        throw new Error(`Invalid MIME type format: ${mimeType}`);
      }
    }
  }

  return { value: normalizedType } as ContentType;
}

/**
 * ContentTypeから文字列値を取得する
 */
export function getContentTypeValue(contentType: ContentType): string {
  return contentType.value;
}

/**
 * ContentTypeの等価性を判定する
 */
export function equalsContentType(a: ContentType, b: ContentType): boolean {
  return a.value === b.value;
}

/**
 * JSONのコンテンツタイプかどうかを判定する
 */
export function isJsonContentType(contentType: ContentType): boolean {
  const value = contentType.value;
  // メインタイプまたはサブタイプ末尾の +json を含むものをJSONとして扱う
  return (
    value === 'application/json' || value.startsWith('application/json;') || value.includes('+json')
  );
}

/**
 * コンテンツタイプに対応する一般的なファイル拡張子を取得する
 */
export function getExtensionForContentType(contentType: ContentType): string {
  // パラメータを除いたメインタイプを取得
  const mainType = contentType.value.split(';')[0]?.trim() || '';

  const extensionMap: Record<string, string> = {
    'application/json': '.json',
    'text/plain': '.txt',
    'text/html': '.html',
    'application/xml': '.xml',
    'application/pdf': '.pdf',
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'application/vnd.api+json': '.json',
    'application/ld+json': '.json',
    'text/csv': '.csv',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/zip': '.zip',
    'application/gzip': '.gz',
    'application/x-bzip2': '.bz2',
    'application/x-xz': '.xz',
  };

  return extensionMap[mainType] || '';
}
