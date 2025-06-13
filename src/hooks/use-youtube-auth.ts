import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { YouTubeClient } from '@/modules/youtube/client';
import { PrivacyStatus } from '@/modules/youtube/types';

export function useYoutubeAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const youtubeClient = new YouTubeClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await youtubeClient.isAuthenticated();
        setIsAuthenticated(isAuth);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const handleCallback = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const auth = searchParams.get('auth');
      
      if (auth === 'success') {
        if (youtubeClient.handleAuthCallback()) {
          const isAuth = await youtubeClient.isAuthenticated();
          setIsAuthenticated(isAuth);
          if (isAuth) {
            toast.success('Successfully authenticated with YouTube');
          }
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else if (auth === 'error') {
        const error = searchParams.get('error');
        toast.error(`Authentication failed: ${error || 'Unknown error'}`);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    if (typeof window !== 'undefined') {
      handleCallback();
    }
  }, []);

  const authenticate = useCallback(async () => {
    setIsLoading(true);
    try {
      const authUrl = await youtubeClient.authenticate();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Authentication error:', error);
      setIsLoading(false);
    }
  }, []);

  const authenticateWithPreconfigured = useCallback(async () => {
    setIsLoading(true);
    try {
      const success = await youtubeClient.authenticateWithPreconfigured();
      if (success) {
        const isAuth = await youtubeClient.isAuthenticated();
        setIsAuthenticated(isAuth);
        if (isAuth) {
          toast.success('Successfully authenticated with preconfigured YouTube account');
        } else {
          toast.error('Failed to authenticate with preconfigured account');
        }
      } else {
        toast.error('Failed to authenticate with preconfigured account');
      }
    } catch (error) {
      console.error('Preconfigured authentication error:', error);
      toast.error('Failed to authenticate with preconfigured account');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await youtubeClient.logout();
      setIsAuthenticated(false);
      toast.success('Successfully logged out from YouTube');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadVideo = useCallback(async (
    videoBlob: Blob,
    title: string,
    description: string,
    tags?: string[],
    privacyStatus: PrivacyStatus = PrivacyStatus.PRIVATE
  ) => {
    if (!isAuthenticated) {
      throw new Error('Not authenticated with YouTube');
    }

    if (videoBlob.size === 0) {
      toast.error('Cannot upload empty file to YouTube');
      throw new Error('File size cannot be 0');
    }

    try {
      setIsUploading(true);
      const videoUrl = await youtubeClient.uploadVideo(videoBlob, title, description, tags, privacyStatus);
      return videoUrl;
    } finally {
      setIsUploading(false);
    }
  }, [isAuthenticated]);

  return {
    isAuthenticated,
    isLoading,
    isUploading,
    authenticate,
    authenticateWithPreconfigured,
    logout,
    uploadVideo
  };
} 