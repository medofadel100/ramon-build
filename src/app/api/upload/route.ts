import { put, del } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename') || 'unnamed_file';
    
    if (!request.body) {
      return NextResponse.json({ error: 'No file body provided' }, { status: 400 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      console.error('BLOB_READ_WRITE_TOKEN is not set in environment variables');
      return NextResponse.json({ error: 'Server configuration error: BLOB token missing' }, { status: 500 });
    }

    // Upload to Vercel Blob
    const blob = await put(filename, request.body, {
      access: 'public',
      token,
    });

    return NextResponse.json(blob);
  } catch (error: any) {
    console.error('Error uploading file to Vercel Blob:', error?.message, error?.stack);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'URL query parameter is required' }, { status: 400 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'Server configuration error: BLOB token missing' }, { status: 500 });
    }

    await del(url, { token });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting file from Vercel Blob:', error?.message, error?.stack);
    return NextResponse.json({ error: error.message || 'Deletion failed' }, { status: 500 });
  }
}
