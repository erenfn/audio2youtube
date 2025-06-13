import { NextResponse } from 'next/server';
import { oauth2Client, FRONTEND_URL, REDIRECT_URI } from '../config';
import { cookies } from 'next/headers';
import { setAuthTokens, AuthSource } from '../utils';

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

    return setAuthTokens({ 
      tokens, 
      source: AuthSource.INITIAL
    });

  } catch (error: any) {
    console.error('Token exchange failed', {
      message: error.message,
      response: error.response?.data,
    });

    return NextResponse.redirect(`${FRONTEND_URL}?error=auth_failed`);
  }
}