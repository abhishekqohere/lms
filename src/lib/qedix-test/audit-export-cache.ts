export type AuditExportCacheEntry = {
  exportId: string;
  userId: string;
  email: string;
  createdAt: number;
  expiresAt?: number;
};

const exportCache = new Map<string, AuditExportCacheEntry>();

export function saveAuditExport(entry: AuditExportCacheEntry) {
  exportCache.set(entry.exportId, entry);
  return entry;
}

export function getAuditExport(exportId: string) {
  return exportCache.get(exportId) ?? null;
}

export function listAuditExports() {
  return Array.from(exportCache.values());
}
