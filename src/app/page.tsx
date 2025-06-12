"use client";
 
import * as React from "react";
import { toast } from "sonner";
import { type FileUploadProps } from "@/components/ui/file-upload";
import { FileUploadSection } from "@/components/file-upload-section";
import { YouTubeSection } from "@/components/youtube-section";
import { useFileConversion } from "@/hooks/use-file-conversion";
import { useYoutubeAuth } from "@/hooks/use-youtube-auth";
import { downloadFile } from "@/utils/file";
import { PrivacyStatus } from "@/modules/youtube/types";

type Resolution = "1080p" | "720p" | "480p";
type AspectRatio = "16:9" | "4:3" | "1:1";

export default function FileUploadValidationDemo() {
  const [autoDownload, setAutoDownload] = React.useState(true);
  const [youtubeTitle, setYoutubeTitle] = React.useState('');
  const [youtubeDescription, setYoutubeDescription] = React.useState('');
  const [youtubeTags, setYoutubeTags] = React.useState<string[]>([]);
  const [privacyStatus, setPrivacyStatus] = React.useState<PrivacyStatus>(PrivacyStatus.PRIVATE);
  const [resolution, setResolution] = React.useState<Resolution>("1080p");
  const [aspectRatio, setAspectRatio] = React.useState<AspectRatio>("16:9");
  const [conversionStartTime, setConversionStartTime] = React.useState<number | null>(null);

  const {
    files,
    setFiles,
    isConverting,
    remainingSeconds,
    convertedBlob,
    handleFileDelete,
    validateFile,
    convertFile
  } = useFileConversion();

  const {
    isAuthenticated,
    isUploading,
    isLoading,
    authenticate,
    logout,
    uploadVideo
  } = useYoutubeAuth();

  const handleDownload = React.useCallback(() => {
    if (!convertedBlob || !files[0]) return;
    downloadFile(convertedBlob, `converted-${files[0].name}.mp4`);
  }, [convertedBlob, files]);

  const onFileReject = React.useCallback((file: File, message: string) => {
    toast(message, {
      description: `"${file.name.length > 20 ? `${file.name.slice(0, 20)}...` : file.name}" has been rejected`,
    });
  }, []);

  const handleYoutubeUpload = React.useCallback(async () => {
    if (!convertedBlob || !files[0]) return;

    const startTime = Date.now();
    try {
      const videoUrl = await uploadVideo(
        convertedBlob,
        youtubeTitle || `Converted ${files[0].name}`,
        youtubeDescription || 'Uploaded via Audio2YouTube',
        youtubeTags,
        privacyStatus
      );

      const uploadDuration = Math.floor((Date.now() - startTime) / 1000);
      toast.success('Video uploaded to YouTube', {
        description: (
          <div>
            Upload completed in {uploadDuration} seconds.{' '}
            You can view it here:{' '}
            <a 
              href={videoUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {videoUrl}
            </a>
          </div>
        ),
      });
    } catch (error) {
      console.error('Error uploading to YouTube:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to upload to YouTube');
      }
    }
  }, [convertedBlob, files, authenticate, uploadVideo, youtubeTitle, youtubeDescription, youtubeTags, privacyStatus]);

  const onUpload: NonNullable<FileUploadProps["onUpload"]> = React.useCallback(
    async (files, { onProgress, onSuccess, onError }) => {
      const startTime = Date.now();
      try {
        setConversionStartTime(startTime);
        const uploadPromises = files.map(async (file) => {
          try {
            const videoBlob = await convertFile(file, (progress) => {
              onProgress(file, progress);
            }, { resolution, aspectRatio });
            
            if (!videoBlob) {
              return;
            }

            if (autoDownload) {
              downloadFile(videoBlob, `converted-${file.name}.mp4`);
            }

            const conversionDuration = Math.floor((Date.now() - startTime) / 1000);
            toast.success('Conversion completed', {
              description: `Your video has been converted in ${conversionDuration} seconds${autoDownload ? ' and downloaded' : ''}`,
            });
            onSuccess(file);
          } catch (error) {
            onError(
              file,
              error instanceof Error ? error : new Error("Upload failed"),
            );
          }
        });
 
        await Promise.all(uploadPromises);
      } catch (error) {
        console.error("Unexpected error during upload:", error);
      } finally {
        setConversionStartTime(null);
      }
    },
    [autoDownload, convertFile, resolution, aspectRatio],
  );

  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <div className="flex flex-col sm:flex-row gap-8 w-full max-w-4xl">
        <FileUploadSection
          files={files}
          setFiles={setFiles}
          isConverting={isConverting}
          remainingSeconds={remainingSeconds}
          convertedBlob={convertedBlob}
          autoDownload={autoDownload}
          setAutoDownload={setAutoDownload}
          onFileValidate={validateFile}
          onFileReject={onFileReject}
          onUpload={onUpload}
          onDelete={handleFileDelete}
          onDownload={handleDownload}
          resolution={resolution}
          setResolution={setResolution}
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          startTime={conversionStartTime || 0}
        />

        <YouTubeSection
          isAuthenticated={isAuthenticated}
          isUploading={isUploading}
          isLoading={isLoading}
          convertedBlob={convertedBlob}
          youtubeTitle={youtubeTitle}
          youtubeDescription={youtubeDescription}
          youtubeTags={youtubeTags}
          privacyStatus={privacyStatus}
          onTitleChange={setYoutubeTitle}
          onDescriptionChange={setYoutubeDescription}
          onTagsChange={setYoutubeTags}
          onPrivacyChange={setPrivacyStatus}
          onAuthenticate={authenticate}
          onLogout={logout}
          onUpload={handleYoutubeUpload}
        />
      </div>
    </div>
  );
}