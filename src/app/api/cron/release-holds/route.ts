import { NextRequest, NextResponse } from "next/server";
import { releaseExpiredSeatHolds } from "@/db/transactions/booking";

export async function GET(req: NextRequest) {
  return handleCleanup(req);
}

export async function POST(req: NextRequest) {
  return handleCleanup(req);
}

async function handleCleanup(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "cinebook_cron_secret_token_auth_998877";

    const isAuthorized =
      authHeader === `Bearer ${cronSecret}` ||
      req.nextUrl.searchParams.get("secret") === cronSecret ||
      process.env.NODE_ENV === "development";

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized cron access." }, { status: 401 });
    }

    const result = await releaseExpiredSeatHolds();

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Cron hold release error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to release holds" },
      { status: 500 }
    );
  }
}
