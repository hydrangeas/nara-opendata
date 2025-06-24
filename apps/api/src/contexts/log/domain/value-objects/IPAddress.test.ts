import { describe, it, expect } from 'vitest';
import {
  createIPAddress,
  getIPAddressValue,
  equalsIPAddress,
  isValidIPAddress,
  isIPv4,
  isIPv6,
  anonymizeIPAddress,
} from './IPAddress';

describe('IPAddress', () => {
  describe('createIPAddress', () => {
    it('有効なIPv4アドレスを作成する', () => {
      const ipAddress = createIPAddress('192.168.1.1');
      expect(getIPAddressValue(ipAddress)).toBe('192.168.1.1');
    });

    it('有効なIPv6アドレスを作成する', () => {
      const ipAddress = createIPAddress('2001:db8::8a2e:370:7334');
      expect(getIPAddressValue(ipAddress)).toBe('2001:db8::8a2e:370:7334');
    });

    it('空文字列を拒否する', () => {
      expect(() => createIPAddress('')).toThrow('IPAddress cannot be empty');
    });

    it('空白のみの文字列を拒否する', () => {
      expect(() => createIPAddress('  ')).toThrow('IPAddress cannot be empty');
    });

    it('無効なIPアドレスを拒否する', () => {
      expect(() => createIPAddress('999.999.999.999')).toThrow('Invalid IP address');
      expect(() => createIPAddress('not-an-ip')).toThrow('Invalid IP address');
      expect(() => createIPAddress('192.168.1')).toThrow('Invalid IP address');
    });

    it('前後の空白を削除する', () => {
      const ipAddress = createIPAddress('  192.168.1.1  ');
      expect(getIPAddressValue(ipAddress)).toBe('192.168.1.1');
    });
  });

  describe('isValidIPAddress', () => {
    it('有効なIPv4アドレスを検証する', () => {
      expect(isValidIPAddress('0.0.0.0')).toBe(true);
      expect(isValidIPAddress('192.168.1.1')).toBe(true);
      expect(isValidIPAddress('255.255.255.255')).toBe(true);
      expect(isValidIPAddress('10.0.0.1')).toBe(true);
    });

    it('無効なIPv4アドレスを検証する', () => {
      expect(isValidIPAddress('256.1.1.1')).toBe(false);
      expect(isValidIPAddress('192.168.1')).toBe(false);
      expect(isValidIPAddress('192.168.1.1.1')).toBe(false);
      expect(isValidIPAddress('192.168.-1.1')).toBe(false);
    });

    it('有効なIPv6アドレスを検証する', () => {
      expect(isValidIPAddress('2001:db8::8a2e:370:7334')).toBe(true);
      expect(isValidIPAddress('fe80::1')).toBe(true);
      expect(isValidIPAddress('::')).toBe(true);
    });
  });

  describe('isIPv4 と isIPv6', () => {
    it('IPv4アドレスを正しく識別する', () => {
      const ipv4 = createIPAddress('192.168.1.1');
      expect(isIPv4(ipv4)).toBe(true);
      expect(isIPv6(ipv4)).toBe(false);
    });

    it('IPv6アドレスを正しく識別する', () => {
      const ipv6 = createIPAddress('2001:db8::8a2e:370:7334');
      expect(isIPv4(ipv6)).toBe(false);
      expect(isIPv6(ipv6)).toBe(true);
    });
  });

  describe('equalsIPAddress', () => {
    it('同じ値のIPアドレスは等しい', () => {
      const ip1 = createIPAddress('192.168.1.1');
      const ip2 = createIPAddress('192.168.1.1');
      expect(equalsIPAddress(ip1, ip2)).toBe(true);
    });

    it('異なる値のIPアドレスは等しくない', () => {
      const ip1 = createIPAddress('192.168.1.1');
      const ip2 = createIPAddress('192.168.1.2');
      expect(equalsIPAddress(ip1, ip2)).toBe(false);
    });
  });

  describe('anonymizeIPAddress', () => {
    it('IPv4アドレスの最後のオクテットを0にする', () => {
      const ip = createIPAddress('192.168.1.123');
      const anonymized = anonymizeIPAddress(ip);
      expect(getIPAddressValue(anonymized)).toBe('192.168.1.0');
    });

    it('IPv6アドレスの後半部分をマスクする', () => {
      const ip = createIPAddress('2001:db8:85a3:8d3:1319:8a2e:370:7334');
      const anonymized = anonymizeIPAddress(ip);
      expect(getIPAddressValue(anonymized)).toBe('2001:db8:85a3:8d3:0:0:0:0');
    });

    it('短縮形のIPv6アドレスも処理できる', () => {
      const ip = createIPAddress('2001:db8::8a2e:370:7334');
      const anonymized = anonymizeIPAddress(ip);
      expect(getIPAddressValue(anonymized)).toBe('2001:db8::8a2e:0:0');
    });
  });
});
