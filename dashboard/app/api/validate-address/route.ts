import { NextRequest, NextResponse } from 'next/server';

import { formatPropertyAddress, validatePropertyAddress, type PropertyAddress } from '@/lib/property-address';
import { validateUsAddress } from '@/lib/address-validation';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const fields = Object.fromEntries(['street', 'unit', 'city', 'state', 'zip'].map(key => [key, typeof body?.[key] === 'string' ? body[key].trim() : ''])) as PropertyAddress;
    const legacyAddress = typeof body?.address === 'string' && !('street' in body) ? body.address : null;
    const fieldError = legacyAddress === null ? validatePropertyAddress(fields) : null;
    if (fieldError) return NextResponse.json({ error: fieldError }, { status: 422 });
    const address = legacyAddress ?? formatPropertyAddress(fields);
    const result = await validateUsAddress(address, legacyAddress === null ? fields : undefined);
    if (!result) {
      return NextResponse.json(
        { error: 'We could not locate this street address in OpenStreetMap. This does not mean the address is invalid. Check the postal city and ZIP; a historic district or neighborhood may differ from the postal city. If it still fails, the address may be missing from the map.' },
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
