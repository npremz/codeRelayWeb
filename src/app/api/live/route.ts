import { NextResponse } from "next/server";
import { getLiveSnapshot } from "@/lib/live-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(await getLiveSnapshot());
}
