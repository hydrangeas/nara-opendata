import { describe, expect, it } from 'vitest';
import { UserAuthenticated } from './UserAuthenticated';
import { DomainEvent } from './DomainEvent';

describe('UserAuthenticated', () => {
  it('必須パラメータでイベントを作成できる', () => {
    const event = new UserAuthenticated('user-123', 'google', 'tier1');

    expect(event.eventName).toBe('UserAuthenticated');
    expect(event.userId).toBe('user-123');
    expect(event.provider).toBe('google');
    expect(event.userTier).toBe('tier1');
    expect(event.ipAddress).toBeUndefined();
    expect(event.userAgent).toBeUndefined();
  });

  it('すべてのパラメータでイベントを作成できる', () => {
    const occurredAt = new Date('2024-01-01T12:00:00Z');
    const event = new UserAuthenticated(
      'user-456',
      'github',
      'tier2',
      '192.168.1.1',
      'Mozilla/5.0',
      occurredAt,
    );

    expect(event.userId).toBe('user-456');
    expect(event.provider).toBe('github');
    expect(event.userTier).toBe('tier2');
    expect(event.ipAddress).toBe('192.168.1.1');
    expect(event.userAgent).toBe('Mozilla/5.0');
    expect(event.occurredAt).toEqual(occurredAt);
  });

  it('DomainEventを継承している', () => {
    const event = new UserAuthenticated('user-123', 'google', 'tier1');

    expect(event).toBeInstanceOf(UserAuthenticated);
    expect(event).toBeInstanceOf(DomainEvent);
  });

  it('getEventDataが正しいデータを返す', () => {
    const event = new UserAuthenticated('user-789', 'email', 'tier3', '10.0.0.1', 'Chrome/120.0');

    const data = event.getEventData();

    expect(data).toEqual({
      userId: 'user-789',
      provider: 'email',
      userTier: 'tier3',
      ipAddress: '10.0.0.1',
      userAgent: 'Chrome/120.0',
    });
  });

  it('getEventDataがオプショナルフィールドを含む', () => {
    const event = new UserAuthenticated('user-123', 'google', 'tier1');

    const data = event.getEventData();

    expect(data).toEqual({
      userId: 'user-123',
      provider: 'google',
      userTier: 'tier1',
      ipAddress: undefined,
      userAgent: undefined,
    });
  });

  it('toJSONで完全なイベント情報を返す', () => {
    const occurredAt = new Date('2024-01-01T12:00:00Z');
    const event = new UserAuthenticated(
      'user-999',
      'github',
      'tier2',
      '172.16.0.1',
      'Safari/17.0',
      occurredAt,
    );

    const json = event.toJSON();

    expect(json).toMatchObject({
      eventName: 'UserAuthenticated',
      eventVersion: 1,
      occurredAt: '2024-01-01T12:00:00.000Z',
      data: {
        userId: 'user-999',
        provider: 'github',
        userTier: 'tier2',
        ipAddress: '172.16.0.1',
        userAgent: 'Safari/17.0',
      },
    });
    expect(json['eventId']).toBeDefined();
  });

  it('異なるプロバイダーとティアの組み合わせをサポート', () => {
    const googleTier1 = new UserAuthenticated('user-1', 'google', 'tier1');
    const githubTier2 = new UserAuthenticated('user-2', 'github', 'tier2');
    const emailTier3 = new UserAuthenticated('user-3', 'email', 'tier3');

    expect(googleTier1.provider).toBe('google');
    expect(googleTier1.userTier).toBe('tier1');
    expect(githubTier2.provider).toBe('github');
    expect(githubTier2.userTier).toBe('tier2');
    expect(emailTier3.provider).toBe('email');
    expect(emailTier3.userTier).toBe('tier3');
  });
});
