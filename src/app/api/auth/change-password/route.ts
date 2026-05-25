import { prisma } from "@/lib/prisma";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";
import { apiError } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  try {
    const body = await request.json();
    const { currentPassword, newPassword } = schema.parse(body);

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return apiError("User not found", 404);

    if (!(await verifyPassword(currentPassword, user.passwordHash))) {
      return apiError("Current password is incorrect", 400);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(newPassword) },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof z.ZodError) return apiError(e.errors[0].message);
    return apiError("Failed to change password", 500);
  }
}
