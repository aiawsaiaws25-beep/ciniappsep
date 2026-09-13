import { NextRequest, NextResponse } from "next/server";
import { confirmBookingTransaction } from "@/db/transactions/booking";
import { z } from "zod";

const payRequestSchema = z.object({
  paymentIntentId: z.string().default("pi_mock_" + Date.now()),
  provider: z.enum(["MOCK_TEST", "STRIPE_TEST"]).default("MOCK_TEST"),
  idempotencyKey: z.string().optional(),
  paymentMethod: z.string().default("card"),
  cardLast4: z.string().default("4242"),
  simulateFailure: z.boolean().default(false),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const parsed = payRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const {
      paymentIntentId,
      provider,
      idempotencyKey,
      paymentMethod,
      cardLast4,
      simulateFailure,
    } = parsed.data;

    if (simulateFailure) {
      return NextResponse.json(
        { error: "Payment declined by issuing bank (Simulated Test Failure)." },
        { status: 402 }
      );
    }

    const result = await confirmBookingTransaction({
      bookingId: id,
      paymentIntentId: paymentIntentId || `mock_pi_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      provider,
      idempotencyKey,
      paymentMethod,
      cardLast4,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Payment confirmation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process payment." },
      { status: 400 }
    );
  }
}
