import { getApiDocs } from '@/lib/swagger';
import { NextResponse } from 'next/server';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  const spec = await getApiDocs();
  return NextResponse.json(spec);
}
