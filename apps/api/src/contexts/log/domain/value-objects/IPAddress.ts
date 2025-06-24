/**
 * IPアドレス属性
 */
export interface IIPAddressAttributes {
  value: string;
}

/**
 * IPアドレスバリューオブジェクト
 * IPv4とIPv6の両方をサポート
 */
export type IPAddress = IIPAddressAttributes & { readonly brand: unique symbol };

/**
 * IPv4の正規表現パターン
 */
const IPV4_PATTERN =
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

/**
 * IPv6の正規表現パターン（簡易版）
 */
const IPV6_PATTERN = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

/**
 * IPアドレスを作成する
 */
export function createIPAddress(value: string): IPAddress {
  if (!value || value.trim() === '') {
    throw new Error('IPAddress cannot be empty');
  }

  const trimmedValue = value.trim();
  if (!isValidIPAddress(trimmedValue)) {
    throw new Error(`Invalid IP address: ${trimmedValue}`);
  }

  return { value: trimmedValue } as IPAddress;
}

/**
 * IPアドレスの値を取得する
 */
export function getIPAddressValue(ipAddress: IPAddress): string {
  return ipAddress.value;
}

/**
 * IPアドレスの等価性を判定する
 */
export function equalsIPAddress(a: IPAddress, b: IPAddress): boolean {
  return a.value === b.value;
}

/**
 * IPアドレスが有効かチェックする
 */
export function isValidIPAddress(value: string): boolean {
  return IPV4_PATTERN.test(value) || IPV6_PATTERN.test(value);
}

/**
 * IPアドレスがIPv4かチェックする
 */
export function isIPv4(ipAddress: IPAddress): boolean {
  return IPV4_PATTERN.test(ipAddress.value);
}

/**
 * IPアドレスがIPv6かチェックする
 */
export function isIPv6(ipAddress: IPAddress): boolean {
  return IPV6_PATTERN.test(ipAddress.value);
}
