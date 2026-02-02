// import { webhooks } from "@dodopayments/better-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {

    // webhooks({
    //   webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_SECRET!,
    //   onPayload: async payload => {
    //     console.log('Received webhook:', payload.event_type);
    //   },
    // });
    return NextResponse.json({ message: 'Webhook processed' }, { status: 200 });
  } catch (error: any) {
    console.error('Error processing Dodo Payments webhook:', error.message);
  } 
}