import { OAuth2Client } from 'google-auth-library';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const FRONTEND_URL = process.env.FRONTEND_URL!;

const REDIRECT_URI = `${FRONTEND_URL}/api/youtube/callback`;

const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

export {
  CLIENT_ID,
  CLIENT_SECRET,
  FRONTEND_URL,
  REDIRECT_URI,
  oauth2Client
}; 