import { NextResponse } from 'next/server';
import { oauth2Client } from '../config';
import { cookies } from 'next/headers';

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
    
    const response = NextResponse.json({ success: true });

    // Log token expiration
    const expiryDate = credentials.expiry_date ? new Date(credentials.expiry_date) : new Date(Date.now() + 3600000);
    console.log('Token refresh - New access token expires at:', expiryDate.toLocaleString());

    // Update the access token cookie
    response.cookies.set('access_token', credentials.access_token!, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: credentials.expiry_date ? Math.floor((credentials.expiry_date - Date.now()) / 1000) : 3600
    });

    return response;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return NextResponse.json({ error: 'Failed to refresh token' }, { status: 500 });
  }
}