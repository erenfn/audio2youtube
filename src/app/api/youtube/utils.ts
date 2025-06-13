import { NextResponse } from 'next/server';
import { FRONTEND_URL } from '@/app/api/youtube/config';

export enum AuthSource {
  INITIAL = 'initial',
  PRECONFIGURED = 'preconfigured',
  REFRESH = 'refresh'
}

interface SetAuthTokensOptions {
  tokens: {
    access_token?: string | null;
    refresh_token?: string | null;
    expiry_date?: number | null;
  };
  source: AuthSource;
}

export function setAuthTokens({ tokens, source }: SetAuthTokensOptions) {
  // Create appropriate response based on source
  const response = source === AuthSource.INITIAL
    ? NextResponse.redirect(`${FRONTEND_URL}?auth=success`)
    : NextResponse.json({ success: true });

  // Log token expiration
  const expiryDate = tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600000);
  console.log(`${source} auth - Access token expires at:`, expiryDate.toLocaleString());

  // Set access token cookie
  if (tokens.access_token) {
    response.cookies.set('access_token', tokens.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600
    });
  }

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
} 