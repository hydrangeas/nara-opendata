import { FilePath, equalsFilePath } from './FilePath';
import { ContentType, equalsContentType, getContentTypeValue } from './ContentType';
import { FileSize } from './FileSize';

/**
 * オープンデータリソースを表すバリューオブジェクト
 * ファイルパス、コンテンツタイプ、ファイルサイズを集約
 */
export interface IOpenDataResourceAttributes {
  path: FilePath;
  contentType: ContentType;
  fileSize?: FileSize;
}

export type OpenDataResource = IOpenDataResourceAttributes & { readonly brand: unique symbol };

/**
 * オープンデータリソースを作成する
 */
export function createOpenDataResource(attributes: {
  path: FilePath;
  contentType: ContentType;
  fileSize?: FileSize;
}): OpenDataResource {
  return {
    path: attributes.path,
    contentType: attributes.contentType,
    fileSize: attributes.fileSize,
  } as OpenDataResource;
}

/**
 * リソースのパスを取得する
 */
export function getResourcePath(resource: OpenDataResource): FilePath {
  return resource.path;
}

/**
 * リソースのコンテンツタイプを取得する
 */
export function getResourceContentType(resource: OpenDataResource): ContentType {
  return resource.contentType;
}

/**
 * リソースのファイルサイズを取得する
 */
export function getResourceFileSize(resource: OpenDataResource): FileSize | undefined {
  return resource.fileSize;
}

/**
 * OpenDataResourceの等価性を判定する
 * パスとコンテンツタイプが同じ場合に等しいとみなす（ファイルサイズは考慮しない）
 */
export function equalsOpenDataResource(a: OpenDataResource, b: OpenDataResource): boolean {
  return equalsFilePath(a.path, b.path) && equalsContentType(a.contentType, b.contentType);
}

/**
 * リソースへのアクセスオプション
 */
export interface IResourceAccessOptions {
  maxFileSizeBytes?: number;
}

/**
 * リソースがアクセス可能かどうかを判定する
 */
export function isResourceAccessible(
  resource: OpenDataResource,
  options: IResourceAccessOptions = {},
): boolean {
  const contentTypeValue = getContentTypeValue(resource.contentType);

  // 許可されたコンテンツタイプのリスト
  const allowedContentTypes = [
    'application/json',
    'application/xml',
    'text/csv',
    'text/plain',
    'text/html',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel
    'application/vnd.ms-excel', // 旧Excel
  ];

  // コンテンツタイプのチェック（パラメータを除いたメインタイプで判定）
  const mainContentType = contentTypeValue.split(';')[0].trim();
  const isAllowedType =
    allowedContentTypes.includes(mainContentType) ||
    mainContentType.includes('+json') || // JSON-LD等
    mainContentType.includes('+xml'); // SOAP等

  if (!isAllowedType) {
    return false;
  }

  // ファイルサイズのチェック（サイズが指定されている場合のみ）
  if (options.maxFileSizeBytes && resource.fileSize) {
    if (resource.fileSize.bytes > options.maxFileSizeBytes) {
      return false;
    }
  }

  return true;
}
