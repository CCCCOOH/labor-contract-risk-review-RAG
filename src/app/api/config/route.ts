import { NextRequest, NextResponse } from "next/server";
import { getConfig } from "@/lib/config";

export async function GET() {
  const config = getConfig();
  return NextResponse.json({
    ...config,
    apiKey: config.apiKey ? "***" + config.apiKey.slice(-4) : "",
  });
}

export async function POST(req: NextRequest) {
  const config = getConfig();
  return NextResponse.json({ status: "ok", model: config.model });
}
