import { describe, it, expect } from 'vitest';
import { broadcast } from '../src/shared/websocket/wsServer';

describe('WebSocket broadcast', () => {
  it('does not throw when no clients', () => {
    expect(() => broadcast({ type: 'test', payload: { x: 1 }, businessId: 'biz-1' })).not.toThrow();
  });
  it('accepts events without businessId', () => {
    expect(() => broadcast({ type: 'test', payload: {} })).not.toThrow();
  });
});