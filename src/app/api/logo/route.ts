import { NextResponse } from 'next/server';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_music-to-numbers/artifacts/eqmmw6fl_2316F097-7806-4D1F-AB36-BB5FF560800D.png';

export async function GET() {
  try {
    const res = await fetch(LOGO_URL);
    if (!res.ok) throw new Error('Failed to fetch logo');
    const buffer = await res.arrayBuffer();
    return new NextResponse(Buffer.from(buffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Logo unavailable' }, { status: 500 });
  }
}
