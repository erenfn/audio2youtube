import { NextResponse } from 'next/server';
import { oauth2Client } from '../config';
import { cookies } from 'next/headers';
import { setAuthTokens, AuthSource } from '../utils';

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refresh_token')?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token available' }, { status: 401 });
  }
  
  try {
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    
    return setAuthTokens({
      tokens: {
        access_token: credentials.access_token,
        refresh_token: refreshToken,
        expiry_date: credentials.expiry_date
      },
      source: AuthSource.REFRESH
    });

  } catch (error) {
    console.error('Error refreshing token:', error);
    return NextResponse.json({ error: 'Failed to refresh token' }, { status: 500 });
  }
}