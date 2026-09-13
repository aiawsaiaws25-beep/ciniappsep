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
      orderBy: (c: any, { asc }: any) => [asc(c.city), asc(c.name)],
    });

    return NextResponse.json({ cinemas: allCinemas });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch cinemas" }, { status: 500 });
  }
}
