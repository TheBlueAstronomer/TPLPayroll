import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  if (process.env.SUPABASE_URL) {
    return new NextResponse('Mock storage disabled in production', { status: 403 });
  }

  // Await the params before using them, as per Next.js 15+ conventions
  const { path: routePath } = await Promise.resolve(params);

  if (!routePath || routePath.length < 2) {
    return new NextResponse('Invalid path', { status: 400 });
  }

  const bucket = routePath[0];
  const storageKey = routePath.slice(1).join('/');
  
  // Save to OS temp directory
  const filePath = path.join(os.tmpdir(), 'tpl-payroll-mock-storage', bucket, storageKey);

  try {
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    const arrayBuffer = await req.arrayBuffer();
    await fs.promises.writeFile(filePath, Buffer.from(arrayBuffer));

    return NextResponse.json({ ok: true, message: 'Mock upload successful' });
  } catch (err) {
    console.error('[Mock Storage] PUT Error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
