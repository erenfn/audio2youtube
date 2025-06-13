'use client';

import { PrivacyStatus } from './types';

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
  private isLoggedIn: boolean = false; // used to track authentication state in frontend

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadChannelInfo();
      this.isLoggedIn = localStorage.getItem('loggedIn') === 'true';
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

  private updateAuthState(loggedIn: boolean): void {
    this.isLoggedIn = loggedIn;
    if (typeof window !== 'undefined') {
      if (loggedIn) {
        localStorage.setItem('loggedIn', 'true');
      } else {
        localStorage.removeItem('loggedIn');
      }
    }
  }

  async authenticate(): Promise<string> {
    const response = await fetch('/api/youtube');
    const data = await response.json();

    if (!data.authUrl) {
      throw new Error('No auth URL received');
    }

    this.updateAuthState(true);
    return data.authUrl;
  }

  async authenticateWithPreconfigured(): Promise<boolean> {
    try {
      const response = await fetch('/api/youtube/preconfigured', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to authenticate with preconfigured account');
      }

      this.updateAuthState(true);
      return true;
    } catch (error) {
      console.error('Error authenticating with preconfigured account:', error);
      this.updateAuthState(false);
      return false;
    }
  }

  handleAuthCallback(): boolean {
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('Auth error:', error);
      return false;
    }

    if (!code) {
      return false;
    }

    return true;
  }

  private async refreshAccessToken(): Promise<boolean> {
    try {
      const response = await fetch('/api/youtube/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        this.updateAuthState(false);
        return false;
      }
      await response.json();
      this.updateAuthState(true);
      return true;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      this.updateAuthState(false);
      return false;
    }
  }

  private async fetchWithAuthRetry(
    input: RequestInfo,
    init?: RequestInit
  ): Promise<Response> {
    let response = await fetch(input, { ...init, credentials: 'include' });

    if (response.status === 401) {
      this.updateAuthState(false);
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        response = await fetch(input, { ...init, credentials: 'include' });
      }
    }

    return response;
  }

  async uploadVideo(
    videoBlob: Blob,
    title: string,
    description: string,
    tags?: string[],
    privacyStatus: PrivacyStatus = PrivacyStatus.PRIVATE
  ): Promise<string> {
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

    const response = await this.fetchWithAuthRetry('/api/youtube', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoBlob: base64data,
        title,
        description,
        tags,
        privacyStatus
      })
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
    if (!this.isLoggedIn) {
      return false;
    }

    try {
      const response = await this.fetchWithAuthRetry('/api/youtube/channel');

      if (response.ok) {
        const data = await response.json();
        this.saveChannelInfo(data);
        this.updateAuthState(true);
        return true;
      }
      this.updateAuthState(false);
      return false;
    } catch (error) {
      console.error('Error checking authentication:', error);
      this.updateAuthState(false);
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

    const response = await this.fetchWithAuthRetry('/api/youtube/channel');

    if (!response.ok) {
      this.updateAuthState(false);
      throw new Error('Failed to fetch channel information');
    }

    const data = await response.json();
    this.saveChannelInfo(data);
    return data;
  }

  logout(): void {
    this.channelInfo = null;
    this.updateAuthState(false);
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