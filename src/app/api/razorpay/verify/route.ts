import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/firebase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      purchaseId, // We'll pass the document ID from the client
      isBook
    } = body;

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throw new Error("Razorpay secret not found");
    }

    // Verify Signature
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Payment verification failed: Invalid signature" },
        { status: 400 }
      );
    }

    // Since the payment is valid, update the Firebase document bypassing rules using admin API
    if (purchaseId && adminDb) {
      const col = isBook ? "bookOrders" : "purchases";
      const updateData: any = {
        status: isBook ? "verified" : "success",
        razorpay_order_id,
        razorpay_payment_id,
        updatedAt: new Date()
      };
      await adminDb.collection(col).doc(purchaseId).update(updateData);
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error("Razorpay Verification Error:", error);
    return NextResponse.json(
      { error: "Failed to verify payment", details: error.message },
      { status: 500 }
    );
  }
}
