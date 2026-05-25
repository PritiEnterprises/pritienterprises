import { getSession } from "@/lib/auth";
import { apiError } from "@/lib/api";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  return NextResponse.json(session);
}
