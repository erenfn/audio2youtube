import { NextResponse } from 'next/server';
import { oauth2Client } from '../config';
import { setAuthTokens, AuthSource } from '../utils';

export async function POST() {
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
  
  if (!refreshToken) {
    return NextResponse.json({ error: 'No preconfigured refresh token available' }, { status: 401 });
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
    console.error('Error authenticating with preconfigured account:', error);
    return NextResponse.json({ error: 'Failed to authenticate with preconfigured account' }, { status: 500 });
  }
} 