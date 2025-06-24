import type { UserId } from '@nara-opendata/shared-kernel';
import type {
  LogId,
  AuthEvent,
  AuthResult,
  Provider,
  IPAddress,
  UserAgent,
} from '../value-objects';
import {
  generateLogId,
  equalsLogId,
  getLogIdValue,
  getAuthEventType,
  getAuthResultValue,
} from '../value-objects';

/**
 * 認証ログエントリ属性
 */
export interface IAuthLogEntryAttributes {
  id: LogId;
  userId: UserId;
  event: AuthEvent;
  provider: Provider;
  ipAddress: IPAddress;
  userAgent: UserAgent;
  timestamp: Date;
  result: AuthResult;
}

/**
 * 認証ログエントリエンティティ
 * 認証イベントの記録を表現
 */
export type AuthLogEntry = IAuthLogEntryAttributes & { readonly brand: unique symbol };

/**
 * 新しい認証ログエントリを作成する
 */
export function createAuthLogEntry(params: {
  userId: UserId;
  event: AuthEvent;
  provider: Provider;
  ipAddress: IPAddress;
  userAgent: UserAgent;
  result: AuthResult;
  timestamp?: Date;
}): AuthLogEntry {
  return {
    id: generateLogId(),
    userId: params.userId,
    event: params.event,
    provider: params.provider,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    timestamp: params.timestamp || new Date(),
    result: params.result,
  } as AuthLogEntry;
}

/**
 * 永続化データから再構築する
 */
export function reconstructAuthLogEntry(attributes: IAuthLogEntryAttributes): AuthLogEntry {
  return {
    id: attributes.id,
    userId: attributes.userId,
    event: attributes.event,
    provider: attributes.provider,
    ipAddress: attributes.ipAddress,
    userAgent: attributes.userAgent,
    timestamp: attributes.timestamp,
    result: attributes.result,
  } as AuthLogEntry;
}

// ゲッター関数
export function getAuthLogEntryId(entry: AuthLogEntry): LogId {
  return entry.id;
}

export function getAuthLogEntryUserId(entry: AuthLogEntry): UserId {
  return entry.userId;
}

export function getAuthLogEntryEvent(entry: AuthLogEntry): AuthEvent {
  return entry.event;
}

export function getAuthLogEntryProvider(entry: AuthLogEntry): Provider {
  return entry.provider;
}

export function getAuthLogEntryIPAddress(entry: AuthLogEntry): IPAddress {
  return entry.ipAddress;
}

export function getAuthLogEntryUserAgent(entry: AuthLogEntry): UserAgent {
  return entry.userAgent;
}

export function getAuthLogEntryTimestamp(entry: AuthLogEntry): Date {
  return entry.timestamp;
}

export function getAuthLogEntryResult(entry: AuthLogEntry): AuthResult {
  return entry.result;
}

/**
 * エンティティの同一性を判定する
 */
export function equalsAuthLogEntry(a: AuthLogEntry, b: AuthLogEntry): boolean {
  return equalsLogId(a.id, b.id);
}

/**
 * デバッグ用の文字列表現
 */
export function authLogEntryToString(entry: AuthLogEntry): string {
  return `AuthLogEntry(id: ${getLogIdValue(entry.id)}, userId: ${
    entry.userId
  }, event: ${getAuthEventType(entry.event)}, result: ${getAuthResultValue(
    entry.result,
  )}, timestamp: ${entry.timestamp.toISOString()})`;
}
