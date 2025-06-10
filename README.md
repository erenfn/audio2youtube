# audio2youtube

audio2youtube is a web application that lets users upload audio files (MP3, WAV, OGG, etc.), converts them into solid-black MP4 videos, and uploads the videos to a configured YouTube account via the YouTube Data API.


# Project Setup

## Obtaining Google OAuth Credentials

1. Open the Credentials page in the API Console:  
   https://console.cloud.google.com/apis/credentials  
   Create your project there by clicking **Create a project**.

2. After creating your project, make sure the YouTube Data API is enabled for your application:  
   
   - **Step 1:** Go to the [API Console](https://console.cloud.google.com/) and select the project you just created.  
   
   - **Step 2:** Visit the [Enabled APIs page](https://console.cloud.google.com/apis/enabled).  
     - In the list of APIs, ensure the **YouTube Data API v3** status is **ON**.


3. To create an OAuth token, go to:  
   https://console.developers.google.com/auth/clients  
   If you haven’t finished the project setup in Google, clicking **Get started** will take you to Overview. Finish the setup there and come back to **Clients**.

4. Click **Create Client**.  
5. Select the **Web application** application type.  
6. Complete the form. Applications that use JavaScript to make authorized Google API requests must specify authorized JavaScript origins. The origins identify the domains from which your application can send requests to the OAuth 2.0 server.

7. Add Authorized redirect URIs:  
   - If in development environment, it is:  
     `http://localhost:3000/api/youtube/callback`

8. Add these fields to your `.env` file. You can access your `client_id` and `client_secret` from the Credentials page. Frontend url is `http://localhost:3000` if in development environment.

<pre>GOOGLE_CLIENT_ID= 
GOOGLE_CLIENT_SECRET= 
FRONTEND_URL=  </pre>

## To run the project

```bash
yarn install
yarn run build
yarn run start
