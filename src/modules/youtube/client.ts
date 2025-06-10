'use client';

export interface YouTubeTokens {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

export interface YouTubeChannelInfo {
  id: string;
  title: string;
  thumbnailUrl: string;
}

export class YouTubeClient {
  private channelInfo: YouTubeChannelInfo | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadChannelInfo();
    }
  }

  private loadChannelInfo() {
    if (typeof window === 'undefined') return;
    
    const savedChannelInfo = localStorage.getItem('youtubeChannelInfo');
    
    if (savedChannelInfo) {
      try {
        this.channelInfo = JSON.parse(savedChannelInfo);
      } catch (error) {
        console.error('Error parsing saved channel info:', error);
        localStorage.removeItem('youtubeChannelInfo');
      }
    }
  }

  private saveChannelInfo(info: YouTubeChannelInfo) {
    this.channelInfo = info;
    if (typeof window !== 'undefined') {
      localStorage.setItem('youtubeChannelInfo', JSON.stringify(info));
    }
  }

  async authenticate(): Promise<string> {
    const response = await fetch('/api/youtube');
    const data = await response.json();
    
    if (!data.authUrl) {
      throw new Error('No auth URL received');
    }
    
    return data.authUrl;
  }

  handleAuthCallback(): boolean {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get('auth') === 'success';
  }

  async uploadVideo(videoBlob: Blob, title: string, description: string, tags?: string[]): Promise<string> {
    const startTime = Date.now();
    
    // Convert blob to base64
    const base64data = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result?.toString().split(',')[1];
        if (!result) throw new Error('Failed to convert video to base64');
        resolve(result);
      };
      reader.readAsDataURL(videoBlob);
    });

    const response = await fetch('/api/youtube', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoBlob: base64data,
        title,
        description,
        tags
      }),
      credentials: 'include'
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to upload to YouTube');
    }

    const uploadDuration = Math.floor((Date.now() - startTime) / 1000);
    console.log(`Upload completed in ${uploadDuration} seconds`);

    return data.videoUrl;
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const response = await fetch('/api/youtube/channel', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.saveChannelInfo(data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  getChannelInfo(): YouTubeChannelInfo | null {
    return this.channelInfo;
  }

  async fetchChannelInfo(): Promise<YouTubeChannelInfo> {
    // If we already have channel info, return it
    if (this.channelInfo) {
      return this.channelInfo;
    }

    const response = await fetch('/api/youtube/channel', {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch channel information');
    }

    const data = await response.json();
    this.saveChannelInfo(data);
    return data;
  }

  logout(): void {
    this.channelInfo = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('youtubeChannelInfo');
    }
    // The cookies will be cleared by the server
    fetch('/api/youtube/logout', {
      method: 'POST',
      credentials: 'include'
    });
  }
} 