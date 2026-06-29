import { NextResponse } from "next/server";
import { tableExists, getStats } from "@/lib/db/lancedb";

export async function GET() {
  const exists = await tableExists();
  const stats = exists ? await getStats() : { count: 0 };
  return NextResponse.json({
    built: exists && stats.count > 0,
    chunkCount: stats.count,
  });
}
