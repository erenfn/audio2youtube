import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { oauth2Client } from '../config';
import { cookies } from 'next/headers';

const youtube = google.youtube('v3');

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  
  if (!accessToken) {
    console.error('Missing access token cookie');
    return NextResponse.json({ error: 'Missing access token cookie' }, { status: 401 });
  }

  oauth2Client.setCredentials({ access_token: accessToken });

  try {
    const response = await youtube.channels.list({
      auth: oauth2Client,
      part: ['snippet'],
      mine: true
    });

    if (!response.data.items || response.data.items.length === 0) {
      console.error('No channel items found in response');
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    const channel = response.data.items[0];
    const channelInfo = {
      id: channel.id,
      title: channel.snippet?.title,
      thumbnailUrl: channel.snippet?.thumbnails?.default?.url
    };

    return NextResponse.json(channelInfo);
  } catch (error) {
    console.error('Error fetching channel info:', error);
    if (error instanceof Error) {
      // Check if it's a 401 unauthorized error
      if (error.message.includes('invalid authentication credentials') || 
          (error as any).code === 401 || 
          (error as any).status === 401) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json({ 
      error: 'Failed to fetch channel information',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 