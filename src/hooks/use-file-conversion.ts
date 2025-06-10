import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { FFmpegConverter } from '@/modules/ffmpeg/converter';
import { FileValidator } from '@/modules/validation/file-validator';
import { IndexedDBStorage } from '@/modules/storage/indexed-db';

type Resolution = "1080p" | "720p" | "480p";
type AspectRatio = "16:9" | "4:3" | "1:1";

interface ConversionOptions {
  resolution: Resolution;
  aspectRatio: AspectRatio;
}

export function useFileConversion() {
  const [files, setFiles] = useState<File[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const ffmpegConverter = useRef(new FFmpegConverter());
  const fileValidator = useRef(new FileValidator(files));
  const storage = useRef(new IndexedDBStorage());

  useEffect(() => {
    setIsMounted(true);
    
    ffmpegConverter.current.load().catch(error => {
      console.error('Failed to load FFmpeg:', error);
      toast.error('Failed to initialize video converter');
    });
  }, []);

  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return;

    storage.current.getConvertedFile()
      .then(({ blob, fileName }) => {
        if (blob && fileName) {
          setConvertedBlob(blob);
          const file = new File([blob], fileName, { type: 'video/mp4' });
          setFiles([file]);
          setIsConverting(false);
          setRemainingSeconds(null);
        }
      })
      .catch(error => {
        console.error('Error loading saved file:', error);
      });
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return;
    
    if (convertedBlob && files[0]) {
      storage.current.saveConvertedFile(convertedBlob, files[0].name)
        .catch(error => {
          console.error('Error saving file to IndexedDB:', error);
        });
    }
  }, [convertedBlob, isMounted, files]);

  const handleFileDelete = useCallback(() => {
    if (isConverting) {
      ffmpegConverter.current.abort();
      setIsConverting(false);
      setRemainingSeconds(null);
      toast.info('Conversion cancelled', {
        description: 'The file conversion has been cancelled',
      });
    }
    setFiles([]);
    setConvertedBlob(null);
    if (isMounted && typeof window !== 'undefined') {
      storage.current.clearConvertedFile()
        .catch(error => {
          console.error('Error clearing IndexedDB:', error);
        });
    }
  }, [isConverting, isMounted]);

  const validateFile = useCallback((file: File): string | null => {
    return fileValidator.current.validate(file);
  }, [files]);

  const getVideoDimensions = (resolution: Resolution, aspectRatio: AspectRatio): { width: number; height: number } => {
    const dimensions = {
      "1080p": { width: 1920, height: 1080 },
      "720p": { width: 1280, height: 720 },
      "480p": { width: 854, height: 480 }
    };

    const baseDimensions = dimensions[resolution];
    const ratio = aspectRatio.split(':').map(Number);
    const targetRatio = ratio[0] / ratio[1];

    if (targetRatio === 16/9) return baseDimensions;
    if (targetRatio === 4/3) {
      return {
        width: baseDimensions.height * (4/3),
        height: baseDimensions.height
      };
    }
    if (targetRatio === 1) {
      return {
        width: baseDimensions.height,
        height: baseDimensions.height
      };
    }

    return baseDimensions;
  };

  const convertFile = useCallback(async (
    file: File,
    onProgress: (progress: number) => void,
    options: ConversionOptions
  ) => {
    try {
      setIsConverting(true);
      setRemainingSeconds(null);
      setConvertedBlob(null);

      const { width, height } = getVideoDimensions(options.resolution, options.aspectRatio);

      const videoBlob = await ffmpegConverter.current.convertToVideo(
        file,
        ({ progress, remainingSeconds }) => {
          onProgress(progress);
          setRemainingSeconds(remainingSeconds ?? null);
        },
        { width, height }
      );

      if (!videoBlob) {
        return null;
      }

      setConvertedBlob(videoBlob);
      return videoBlob;
    } catch (error) {
      console.error('Error converting file:', error);
      throw error;
    } finally {
      setIsConverting(false);
      setRemainingSeconds(null);
    }
  }, []);

  return {
    files,
    setFiles,
    isConverting,
    remainingSeconds,
    convertedBlob,
    handleFileDelete,
    validateFile,
    convertFile
  };
} 