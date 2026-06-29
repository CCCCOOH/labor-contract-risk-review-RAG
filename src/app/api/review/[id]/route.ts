import { NextRequest, NextResponse } from "next/server";
import { getContract, saveReport, getReportByContractId } from "@/lib/store";
import { reviewEachDimension } from "@/lib/review/pipeline";
import { ReviewReport } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contract = await getContract(params.id);
    if (!contract) {
      return NextResponse.json({ error: "合同不存在" }, { status: 404 });
    }

    // Return cached report immediately
    const existing = await getReportByContractId(params.id);
    if (existing) {
      return NextResponse.json({ report: existing, cached: true });
    }

    // SSE streaming review
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const allFindings: ReviewReport["findings"] = [];

        try {
          for await (const result of reviewEachDimension(contract)) {
            // Send progress event
            const progressData = {
              dimensionKey: result.dimension.key,
              dimensionName: result.dimension.name,
              current: result.current,
              total: result.total,
              findings: result.findings,
              error: result.error,
            };
            controller.enqueue(
              encoder.encode(`event: progress\ndata: ${JSON.stringify(progressData)}\n\n`)
            );

            if (!result.error) {
              allFindings.push(...result.findings);
            }
          }

          // Build and save report
          const report: ReviewReport = {
            id: uuidv4(),
            contractId: contract.id,
            createdAt: new Date().toISOString(),
            findings: allFindings,
            summary: generateSummary(allFindings),
          };

          await saveReport(report);

          // Send complete event
          controller.enqueue(
            encoder.encode(`event: complete\ndata: ${JSON.stringify({ report })}\n\n`)
          );
        } catch (e: any) {
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ error: e.message || String(e) })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const report = await getReportByContractId(params.id);
  if (!report) {
    return NextResponse.json({ error: "报告不存在" }, { status: 404 });
  }
  const contract = await getContract(params.id);
  return NextResponse.json({ report, contract });
}

function generateSummary(findings: ReviewReport["findings"]): string {
  const high = findings.filter((f) => f.severity === "high").length;
  const medium = findings.filter((f) => f.severity === "medium").length;
  const low = findings.filter((f) => f.severity === "low").length;

  if (findings.length === 0) return "未发现明显风险，合同条款基本合规。";

  const parts = [];
  if (high > 0) parts.push(`${high} 项高风险`);
  if (medium > 0) parts.push(`${medium} 项中风险`);
  if (low > 0) parts.push(`${low} 项低风险`);
  return `共发现 ${findings.length} 项风险（${parts.join("、")}），建议重点关注高风险项并及时修改。`;
}
