import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";
import { apiError } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = schema.parse(body);

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return apiError("Invalid username or password", 401);
    }

    const token = await createSessionToken({
      userId: user.id,
      username: user.username,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      user: { username: user.username, name: user.name },
    });

    response.cookies.set({
      ...sessionCookieOptions(),
      value: token,
    });

    return response;
  } catch (e) {
    if (e instanceof z.ZodError) return apiError(e.errors[0].message);
    return apiError("Login failed", 500);
  }
}
