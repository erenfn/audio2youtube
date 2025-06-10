import { google, youtube_v3 } from 'googleapis';
import { NextResponse } from 'next/server';
import { GaxiosResponse } from 'gaxios';
import { oauth2Client} from './config';
import { CodeChallengeMethod } from 'google-auth-library';
import { Readable } from 'stream';
import { cookies } from 'next/headers';
const youtube = google.youtube('v3');

import { generateCodeVerifier, generateCodeChallenge } from '@/modules/youtube/generatePKCECodes';

export async function GET(request: Request) {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  const response = NextResponse.json({
    authUrl: oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: true,
      scope: [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.readonly'
      ],
      code_challenge: codeChallenge,
      code_challenge_method: CodeChallengeMethod.S256,
    }),
  });

  response.cookies.set('code_verifier', codeVerifier, {
    httpOnly: true,
    path: '/',
    maxAge: 300,
  });

  return response;
}

export async function POST(request: Request) {
  const { videoBlob, title, description, tags } = await request.json();
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  
  if (!accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!videoBlob || !title) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  oauth2Client.setCredentials({ access_token: accessToken });

  try {
    const media = Buffer.from(videoBlob, 'base64');
    const mediaStream = Readable.from(media);
    
    const res = await youtube.videos.insert(
      {
        auth: oauth2Client,
        part: ['snippet', 'status'],
        notifySubscribers: false,
        requestBody: {
          snippet: {
            title,
            description: description || '',
            categoryId: '22',
            tags: tags || []
          },
          status: {
            privacyStatus: 'private',
            selfDeclaredMadeForKids: false
          }
        },
        media: {
          body: mediaStream
        }
      }
    ) as unknown as GaxiosResponse<youtube_v3.Schema$Video>;

    if (res.status === 200 && res.data) {
      return NextResponse.json({
        success: true,
        videoId: res.data.id,
        videoUrl: `https://www.youtube.com/watch?v=${res.data.id}`
      });
    } else {
      console.error('Upload failed', res.statusText);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
