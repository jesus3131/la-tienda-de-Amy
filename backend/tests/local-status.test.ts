import { describe, expect, it } from 'vitest';
import { createLocalNodeStatus } from '../src/shared/sync/localStatus';

describe('local node status', () => {
  it('reports a local node without claiming synchronization is configured', () => {
    expect(createLocalNodeStatus('local', 'local-primary', 3)).toEqual({
      mode: 'local',
      nodeId: 'local-primary',
      syncConfigured: false,
      pendingEvents: 3,
      lastSuccessfulSync: null,
    });
  });

  it('normalizes unknown roles and negative pending counts safely', () => {
    expect(createLocalNodeStatus('unknown', 'central', -1)).toEqual({
      mode: 'central',
      nodeId: 'central',
      syncConfigured: false,
      pendingEvents: 0,
      lastSuccessfulSync: null,
    });
  });
});
