/**
 * UserAgent属性
 */
export interface IUserAgentAttributes {
  value: string;
}

/**
 * UserAgentバリューオブジェクト
 * HTTPリクエストのUser-Agentヘッダー情報
 */
export type UserAgent = IUserAgentAttributes & { readonly brand: unique symbol };

/**
 * UserAgent解析結果
 */
export interface IParsedUserAgent {
  browser?: string;
  browserVersion?: string;
  os?: string;
  osVersion?: string;
  device?: string;
  isBot: boolean;
}

/**
 * UserAgentを作成する
 */
export function createUserAgent(value: string): UserAgent {
  if (!value || value.trim() === '') {
    throw new Error('UserAgent cannot be empty');
  }
  return { value: value.trim() } as UserAgent;
}

/**
 * UserAgentの値を取得する
 */
export function getUserAgentValue(userAgent: UserAgent): string {
  return userAgent.value;
}

/**
 * UserAgentの等価性を判定する
 */
export function equalsUserAgent(a: UserAgent, b: UserAgent): boolean {
  return a.value === b.value;
}

/**
 * UserAgentを解析する（簡易版）
 * 実際のプロダクションではより高度な解析ライブラリを使用することを推奨
 */
export function parseUserAgent(userAgent: UserAgent): IParsedUserAgent {
  const value = userAgent.value.toLowerCase();
  const result: IParsedUserAgent = { isBot: false };

  // ブラウザの検出
  if (value.includes('chrome/')) {
    result.browser = 'Chrome';
    const match = value.match(/chrome\/(\d+\.\d+)/);
    if (match && match[1]) result.browserVersion = match[1];
  } else if (value.includes('firefox/')) {
    result.browser = 'Firefox';
    const match = value.match(/firefox\/(\d+\.\d+)/);
    if (match && match[1]) result.browserVersion = match[1];
  } else if (value.includes('safari/') && !value.includes('chrome/')) {
    result.browser = 'Safari';
    const match = value.match(/version\/(\d+\.\d+)/);
    if (match && match[1]) result.browserVersion = match[1];
  } else if (value.includes('edge/')) {
    result.browser = 'Edge';
    const match = value.match(/edge\/(\d+\.\d+)/);
    if (match && match[1]) result.browserVersion = match[1];
  }

  // OSの検出
  if (value.includes('windows nt')) {
    result.os = 'Windows';
    const match = value.match(/windows nt (\d+\.\d+)/);
    if (match) {
      const version = match[1];
      if (version === '10.0') result.osVersion = '10';
      else if (version === '6.3') result.osVersion = '8.1';
      else if (version === '6.2') result.osVersion = '8';
      else if (version === '6.1') result.osVersion = '7';
    }
  } else if (value.includes('iphone') || value.includes('ipad')) {
    result.os = 'iOS';
    const match = value.match(/os (\d+[_.]?\d+)/);
    if (match && match[1]) result.osVersion = match[1].replace('_', '.');
  } else if (value.includes('mac os x')) {
    result.os = 'macOS';
    const match = value.match(/mac os x (\d+[_.]?\d+)/);
    if (match && match[1]) result.osVersion = match[1].replace('_', '.');
  } else if (value.includes('android')) {
    result.os = 'Android';
    const match = value.match(/android (\d+(?:\.\d+)?)/);
    if (match && match[1]) result.osVersion = match[1];
  } else if (value.includes('linux')) {
    result.os = 'Linux';
  }

  // デバイスの検出
  if (value.includes('mobile')) {
    result.device = 'Mobile';
  } else if (value.includes('tablet') || value.includes('ipad')) {
    result.device = 'Tablet';
  } else {
    result.device = 'Desktop';
  }

  // ボットの検出
  const botPatterns = [
    'bot',
    'crawler',
    'spider',
    'scraper',
    'googlebot',
    'bingbot',
    'slurp',
    'duckduckbot',
    'baiduspider',
    'yandexbot',
    'curl',
    'wget',
    'postman',
  ];
  result.isBot = botPatterns.some((pattern) => value.includes(pattern));

  return result;
}
