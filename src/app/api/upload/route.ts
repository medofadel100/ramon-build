import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as HandleUploadBody;
    const token = process.env.ramonbuild_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'application/acad',
            'image/vnd.dwg',
            'image/x-dwg',
            'application/x-dwg',
            'application/octet-stream'
          ],
          tokenPayload: JSON.stringify({}),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('blob upload completed', blob, tokenPayload);
      },
      token: token
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 } // The webhook will retry 500 errors
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'URL query parameter is required' }, { status: 400 });
    }

    const token = process.env.ramonbuild_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
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
