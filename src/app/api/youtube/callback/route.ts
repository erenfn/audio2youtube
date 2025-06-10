import { NextResponse } from 'next/server';
import { oauth2Client, FRONTEND_URL, REDIRECT_URI } from '../config';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const cookieStore = await cookies();
    const codeVerifier = cookieStore.get('code_verifier')?.value;

    if (!code || !codeVerifier) {
      console.error('Missing code or verifier', { code: !!code, verifier: !!codeVerifier });
      return NextResponse.redirect(`${FRONTEND_URL}?error=missing_code_or_verifier`);
    }

    const { tokens } = await oauth2Client.getToken({
      code,
      codeVerifier,
      redirect_uri: REDIRECT_URI,
    });

    const response = NextResponse.redirect(`${FRONTEND_URL}?auth=success`);

    // Set access token cookie
    response.cookies.set('access_token', tokens.access_token!, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600
    });

    // Set refresh token cookie
    if (tokens.refresh_token) {
      response.cookies.set('refresh_token', tokens.refresh_token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 // 30 days
      });
    }

    return response;
  } catch (error: any) {
    console.error('Token exchange failed', {
      message: error.message,
      response: error.response?.data,
    });

    return NextResponse.redirect(`${FRONTEND_URL}?error=auth_failed`);
  }
}