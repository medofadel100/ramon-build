import { put, del } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename') || 'unnamed_file';
    
    if (!request.body) {
      return NextResponse.json({ error: 'No file body provided' }, { status: 400 });
    }

    // Upload to Vercel Blob using the explicit server token
    const blob = await put(filename, request.body, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json(blob);
  } catch (error: any) {
    console.error('Error uploading file to Vercel Blob:', error);
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

    // Delete from Vercel Blob using the explicit server token
    await del(url, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting file from Vercel Blob:', error);
    return NextResponse.json({ error: error.message || 'Deletion failed' }, { status: 500 });
  }
}
