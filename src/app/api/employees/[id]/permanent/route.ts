import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    const employeeId = context.params.id;

    // Check attendance records
    const attendanceCount = await prisma.attendance.count({
      where: {
        employeeId,
      },
    });

    // Check advance records
    const advanceCount = await prisma.employeeAdvance.count({
      where: {
        employeeId,
      },
    });

    // Prevent delete if records exist
    if (attendanceCount > 0 || advanceCount > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete employee with existing records. Deactivate instead.",
        },
        { status: 400 }
      );
    }

    // Delete employee
    await prisma.employee.delete({
      where: {
        id: employeeId,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE EMPLOYEE ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to delete employee",
      },
      { status: 500 }
    );
  }
}