import { NextResponse } from "next/server";
import { getAllContracts, getReportByContractId, getChatSessionsByContract } from "@/lib/store";

export async function GET() {
  try {
    const contracts = await getAllContracts();

    const items = await Promise.all(
      contracts.map(async (c) => {
        const report = await getReportByContractId(c.id);
        const sessions = await getChatSessionsByContract(c.id);
        return {
          id: c.id,
          fileName: c.fileName,
          fileType: c.fileType,
          uploadedAt: c.uploadedAt,
          clauseCount: c.clauses.length,
          reviewed: !!report,
          reportId: report?.id || null,
          riskCount: report?.findings.length || 0,
          highRiskCount: report?.findings.filter((f) => f.severity === "high").length || 0,
          sessionCount: sessions.length,
        };
      })
    );

    return NextResponse.json({ contracts: items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
