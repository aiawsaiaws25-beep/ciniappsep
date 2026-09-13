import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cinemas } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const allCinemas = await db.query.cinemas.findMany({
      where: eq(cinemas.isActive, true),
      with: {
        auditoriums: true,
      },
      orderBy: (cinemas, { asc }) => [asc(cinemas.city), asc(cinemas.name)],
    });

    return NextResponse.json({ cinemas: allCinemas });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch cinemas" }, { status: 500 });
  }
}
