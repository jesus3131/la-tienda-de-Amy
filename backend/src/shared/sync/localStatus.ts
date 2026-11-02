export type SyncMode = 'local' | 'central';

export interface LocalNodeStatus {
  mode: SyncMode;
  nodeId: string;
  syncConfigured: false;
  pendingEvents: number;
  lastSuccessfulSync: null;
}

export function createLocalNodeStatus(mode: string, nodeId: string, pendingEvents: number): LocalNodeStatus {
  return {
    mode: mode === 'local' ? 'local' : 'central',
    nodeId,
    syncConfigured: false,
    pendingEvents: Math.max(0, pendingEvents),
    lastSuccessfulSync: null,
  };
}
