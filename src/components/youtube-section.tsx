import { Button } from "@/components/ui/button";
import { Youtube } from "lucide-react";
import { YouTubeMetadataForm } from "@/components/youtube/metadata-form";
import { useEffect, useState } from "react";
import { YouTubeClient, YouTubeChannelInfo } from "@/modules/youtube/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface YouTubeSectionProps {
  isAuthenticated: boolean;
  isUploading: boolean;
  convertedBlob: Blob | null;
  youtubeTitle: string;
  youtubeDescription: string;
  youtubeTags: string[];
  isPrivate: boolean;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onTagsChange: (tags: string[]) => void;
  onPrivacyChange: (isPrivate: boolean) => void;
  onAuthenticate: () => void;
  onLogout: () => void;
  onUpload: () => void;
}

export function YouTubeSection({
  isAuthenticated,
  isUploading,
  convertedBlob,
  youtubeTitle,
  youtubeDescription,
  youtubeTags,
  isPrivate,
  onTitleChange,
  onDescriptionChange,
  onTagsChange,
  onPrivacyChange,
  onAuthenticate,
  onLogout,
  onUpload,
}: YouTubeSectionProps) {
  const [channelInfo, setChannelInfo] = useState<YouTubeChannelInfo | null>(null);
  const youtubeClient = new YouTubeClient();

  useEffect(() => {
    if (isAuthenticated) {
      // First try to get cached channel info
      const cachedInfo = youtubeClient.getChannelInfo();
      if (cachedInfo) {
        setChannelInfo(cachedInfo);
      } else {
        // Only fetch if we don't have cached info
        const fetchChannelInfo = async () => {
          try {
            const info = await youtubeClient.fetchChannelInfo();
            setChannelInfo(info);
          } catch (error) {
            console.error('Error fetching channel info:', error);
          }
        };
        fetchChannelInfo();
      }
    }
  }, [isAuthenticated]);

  return (
    <div className="flex-1 border-t sm:border-t-0 sm:border-l pt-8 sm:pt-0 sm:pl-8">
      <div className="flex flex-col gap-2">
        {isAuthenticated && channelInfo && (
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="size-10">
              <AvatarImage src={channelInfo.thumbnailUrl} alt={channelInfo.title} />
              <AvatarFallback>{channelInfo.title.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{channelInfo.title}</p>
              <p className="text-sm text-muted-foreground">YouTube Channel</p>
            </div>
          </div>
        )}

        {isAuthenticated && convertedBlob && (
          <YouTubeMetadataForm
            title={youtubeTitle}
            description={youtubeDescription}
            tags={youtubeTags}
            isPrivate={isPrivate}
            onTitleChange={onTitleChange}
            onDescriptionChange={onDescriptionChange}
            onTagsChange={onTagsChange}
            onPrivacyChange={onPrivacyChange}
          />
        )}
        
        <Button
          variant="outline"
          className="w-full mt-2"
          onClick={isAuthenticated ? onUpload : onAuthenticate}
          disabled={isUploading}
        >
          <Youtube className="size-4 mr-2" />
          {isAuthenticated ? 'Upload to YouTube' : 'Connect YouTube Account'}
        </Button>
        {isAuthenticated && (
          <Button
            variant="ghost"
            className="w-full mt-2"
            onClick={onLogout}
          >
            Logout from YouTube
          </Button>
        )}
        {isUploading && (
          <p className="text-sm text-muted-foreground text-center">
            Uploading to YouTube...
          </p>
        )}
      </div>
    </div>
  );
} 
