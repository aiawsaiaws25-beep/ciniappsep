import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ user: null });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.id),
      columns: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: user || null });
  } catch (error: any) {
    return NextResponse.json({ user: null, error: error.message });
  }
}
