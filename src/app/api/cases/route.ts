import { NextRequest, NextResponse } from "next/server";
import { getPublicCases, submitCase } from "@/lib/actions/cases";
import { CaseInsert } from "@/types/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const ageGroup = searchParams.get("ageGroup") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    const cases = await getPublicCases({ category, ageGroup, status, search });
    return NextResponse.json({ success: true, cases });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch cases";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CaseInsert;

    if (!body.title || !body.patient_name || !body.amount_needed) {
      return NextResponse.json(
        { success: false, error: "Missing required case fields" },
        { status: 400 }
      );
    }

    const res = await submitCase(body);
    return NextResponse.json(res);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to submit case";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
