import { NextRequest, NextResponse } from 'next/server';

import { validateUsAddress } from '@/lib/address-validation';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { address?: unknown };
    const address = typeof body.address === 'string' ? body.address : '';
    const result = await validateUsAddress(address);
    if (!result) {
      return NextResponse.json(
        { error: 'Enter a complete, existing U.S. street address.' },
        { status: 422 },
      );
    }
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json(
      { error: 'Address validation is temporarily unavailable. Please try again.' },
      { status: 503 },
    );
  }
}
