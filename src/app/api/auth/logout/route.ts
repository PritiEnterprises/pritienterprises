import { COOKIE_NAME } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return response;
}
