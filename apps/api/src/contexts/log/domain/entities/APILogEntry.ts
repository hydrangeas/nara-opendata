import type { UserId } from '@nara-opendata/shared-kernel';
import type {
  LogId,
  RequestId,
  StatusCode,
  ResponseTime,
  IPAddress,
  UserAgent,
} from '../value-objects';
import { generateLogId, equalsLogId, getLogIdValue } from '../value-objects';

/**
 * APIログエントリ属性
 */
export interface IAPILogEntryAttributes {
  id: LogId;
  userId: UserId;
  requestId: RequestId;
  path: string;
  statusCode: StatusCode;
  responseTime: ResponseTime;
  ipAddress: IPAddress;
  userAgent: UserAgent;
  timestamp: Date;
}

/**
 * APIログエントリエンティティ
 * APIアクセスの記録を表現
 */
export type APILogEntry = IAPILogEntryAttributes & { readonly brand: unique symbol };

/**
 * 新しいAPIログエントリを作成する
 */
export function createAPILogEntry(params: {
  userId: UserId;
  requestId: RequestId;
  path: string;
  statusCode: StatusCode;
  responseTime: ResponseTime;
  ipAddress: IPAddress;
  userAgent: UserAgent;
  timestamp?: Date;
}): APILogEntry {
  if (!params.path || params.path.trim() === '') {
    throw new Error('Path is required for APILogEntry');
  }

  return {
    id: generateLogId(),
    userId: params.userId,
    requestId: params.requestId,
    path: params.path,
    statusCode: params.statusCode,
    responseTime: params.responseTime,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    timestamp: params.timestamp || new Date(),
  } as APILogEntry;
}

/**
 * 永続化データから再構築する
 */
export function reconstructAPILogEntry(attributes: IAPILogEntryAttributes): APILogEntry {
  if (!attributes.path || attributes.path.trim() === '') {
    throw new Error('Path is required for APILogEntry');
  }

  return {
    id: attributes.id,
    userId: attributes.userId,
    requestId: attributes.requestId,
    path: attributes.path,
    statusCode: attributes.statusCode,
    responseTime: attributes.responseTime,
    ipAddress: attributes.ipAddress,
    userAgent: attributes.userAgent,
    timestamp: attributes.timestamp,
  } as APILogEntry;
}

// ゲッター関数
export function getAPILogEntryId(entry: APILogEntry): LogId {
  return entry.id;
}

export function getAPILogEntryUserId(entry: APILogEntry): UserId {
  return entry.userId;
}

export function getAPILogEntryRequestId(entry: APILogEntry): RequestId {
  return entry.requestId;
}

export function getAPILogEntryPath(entry: APILogEntry): string {
  return entry.path;
}

export function getAPILogEntryStatusCode(entry: APILogEntry): StatusCode {
  return entry.statusCode;
}

export function getAPILogEntryResponseTime(entry: APILogEntry): ResponseTime {
  return entry.responseTime;
}

export function getAPILogEntryIPAddress(entry: APILogEntry): IPAddress {
  return entry.ipAddress;
}

export function getAPILogEntryUserAgent(entry: APILogEntry): UserAgent {
  return entry.userAgent;
}

export function getAPILogEntryTimestamp(entry: APILogEntry): Date {
  return entry.timestamp;
}

/**
 * エンティティの同一性を判定する
 */
export function equalsAPILogEntry(a: APILogEntry, b: APILogEntry): boolean {
  return equalsLogId(a.id, b.id);
}

/**
 * デバッグ用の文字列表現
 */
export function apiLogEntryToString(entry: APILogEntry): string {
  return `APILogEntry(id: ${getLogIdValue(entry.id)}, userId: ${
    entry.userId
  }, path: ${entry.path}, status: ${entry.statusCode.code}, responseTime: ${
    entry.responseTime.milliseconds
  }ms, timestamp: ${entry.timestamp.toISOString()})`;
}
