import { describe, it, expect } from 'vitest';
import { createUserAgent, getUserAgentValue, equalsUserAgent, parseUserAgent } from './UserAgent';

describe('UserAgent', () => {
  describe('createUserAgent', () => {
    it('有効なUserAgentを作成する', () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      const userAgent = createUserAgent(ua);
      expect(getUserAgentValue(userAgent)).toBe(ua);
    });

    it('空文字列を拒否する', () => {
      expect(() => createUserAgent('')).toThrow('UserAgent cannot be empty');
    });

    it('空白のみの文字列を拒否する', () => {
      expect(() => createUserAgent('  ')).toThrow('UserAgent cannot be empty');
    });

    it('前後の空白を削除する', () => {
      const ua = '  Mozilla/5.0  ';
      const userAgent = createUserAgent(ua);
      expect(getUserAgentValue(userAgent)).toBe('Mozilla/5.0');
    });
  });

  describe('equalsUserAgent', () => {
    it('同じ値のUserAgentは等しい', () => {
      const ua = 'Mozilla/5.0';
      const userAgent1 = createUserAgent(ua);
      const userAgent2 = createUserAgent(ua);
      expect(equalsUserAgent(userAgent1, userAgent2)).toBe(true);
    });

    it('異なる値のUserAgentは等しくない', () => {
      const userAgent1 = createUserAgent('Mozilla/5.0');
      const userAgent2 = createUserAgent('Chrome/96.0');
      expect(equalsUserAgent(userAgent1, userAgent2)).toBe(false);
    });
  });

  describe('parseUserAgent', () => {
    it('Chrome on Windowsを解析する', () => {
      const ua =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36';
      const userAgent = createUserAgent(ua);
      const parsed = parseUserAgent(userAgent);

      expect(parsed.browser).toBe('Chrome');
      expect(parsed.browserVersion).toBe('96.0');
      expect(parsed.os).toBe('Windows');
      expect(parsed.osVersion).toBe('10');
      expect(parsed.device).toBe('Desktop');
      expect(parsed.isBot).toBe(false);
    });

    it('Safari on macOSを解析する', () => {
      const ua =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15';
      const userAgent = createUserAgent(ua);
      const parsed = parseUserAgent(userAgent);

      expect(parsed.browser).toBe('Safari');
      expect(parsed.browserVersion).toBe('15.1');
      expect(parsed.os).toBe('macOS');
      expect(parsed.osVersion).toBe('10.15');
      expect(parsed.device).toBe('Desktop');
      expect(parsed.isBot).toBe(false);
    });

    it('Firefox on Linuxを解析する', () => {
      const ua = 'Mozilla/5.0 (X11; Linux x86_64; rv:95.0) Gecko/20100101 Firefox/95.0';
      const userAgent = createUserAgent(ua);
      const parsed = parseUserAgent(userAgent);

      expect(parsed.browser).toBe('Firefox');
      expect(parsed.browserVersion).toBe('95.0');
      expect(parsed.os).toBe('Linux');
      expect(parsed.device).toBe('Desktop');
      expect(parsed.isBot).toBe(false);
    });

    it('Chrome on Androidを解析する', () => {
      const ua =
        'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.104 Mobile Safari/537.36';
      const userAgent = createUserAgent(ua);
      const parsed = parseUserAgent(userAgent);

      expect(parsed.browser).toBe('Chrome');
      expect(parsed.browserVersion).toBe('96.0');
      expect(parsed.os).toBe('Android');
      expect(parsed.osVersion).toBe('11');
      expect(parsed.device).toBe('Mobile');
      expect(parsed.isBot).toBe(false);
    });

    it('Safari on iPhoneを解析する', () => {
      const ua =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 15_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Mobile/15E148 Safari/604.1';
      const userAgent = createUserAgent(ua);
      const parsed = parseUserAgent(userAgent);

      expect(parsed.os).toBe('iOS');
      expect(parsed.osVersion).toBe('15.1');
      expect(parsed.device).toBe('Mobile');
      expect(parsed.isBot).toBe(false);
    });

    it('Googlebotを検出する', () => {
      const ua = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
      const userAgent = createUserAgent(ua);
      const parsed = parseUserAgent(userAgent);

      expect(parsed.isBot).toBe(true);
    });

    it('cURLを検出する', () => {
      const ua = 'curl/7.79.1';
      const userAgent = createUserAgent(ua);
      const parsed = parseUserAgent(userAgent);

      expect(parsed.isBot).toBe(true);
    });

    it('Postmanを検出する', () => {
      const ua = 'PostmanRuntime/7.28.4';
      const userAgent = createUserAgent(ua);
      const parsed = parseUserAgent(userAgent);

      expect(parsed.isBot).toBe(true);
    });
  });
});
