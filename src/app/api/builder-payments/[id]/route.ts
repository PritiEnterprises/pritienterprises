import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
    projectId: z.string(),
    paymentType: z.enum([
        "ADVANCE",
        "INTERIM",
        "FINAL",
        "OTHER",
    ]),
    amount: z.number().positive(),
    date: z.string().optional(),
    reference: z.string().optional(),
    notes: z.string().optional(),
});

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();

        const data = schema.parse(body);

        const payment =
            await prisma.builderPayment.update({
                where: {
                    id: params.id,
                },
                data: {
                    projectId: data.projectId,
                    paymentType: data.paymentType,
                    amount: data.amount,
                    date: data.date
                        ? new Date(data.date)
                        : undefined,
                    reference: data.reference,
                    notes: data.notes,
                },
            });

        return NextResponse.json(payment);
    } catch (e) {
        if (e instanceof z.ZodError) {
            return apiError(e.errors[0].message);
        }

        return apiError(
            "Failed to update payment",
            500
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.builderPayment.delete({
            where: {
                id: params.id,
            },
        });

        return NextResponse.json({
            success: true,
        });
    } catch {
        return apiError(
            "Failed to delete payment",
            500
        );
    }
}