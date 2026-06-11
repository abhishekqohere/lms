import { NextResponse } from "next/server";
import {
  listAuditExports,
  saveAuditExport,
} from "../../../../lib/qedix-test/audit-export-cache";

type AuditExportRequest = {
  exportId?: string;
  userId?: string;
  email?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as AuditExportRequest;

  const exportId = body.exportId ?? `export-${Date.now()}`;

  const saved = saveAuditExport({
    exportId,
    userId: body.userId ?? "unknown-user",
    email: body.email ?? "unknown@example.com",
    createdAt: Date.now(),
  });

  return NextResponse.json({
    success: true,
    data: {
      saved,
      allExports: listAuditExports(),
    },
  });
}
