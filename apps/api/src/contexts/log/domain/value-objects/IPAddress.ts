import { isIP, isIPv4 as isIPv4Native, isIPv6 as isIPv6Native } from 'net';

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
 * Node.js標準のnet APIを使用してより厳密な検証を実施
 */
export function isValidIPAddress(value: string): boolean {
  return isIP(value) !== 0; // 0: invalid, 4: IPv4, 6: IPv6
}

/**
 * IPアドレスがIPv4かチェックする
 */
export function isIPv4(ipAddress: IPAddress): boolean {
  return isIPv4Native(ipAddress.value);
}

/**
 * IPアドレスがIPv6かチェックする
 */
export function isIPv6(ipAddress: IPAddress): boolean {
  return isIPv6Native(ipAddress.value);
}
