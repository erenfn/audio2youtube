import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export interface ConversionProgress {
  progress: number;
  remainingSeconds?: number;
  elapsedSeconds?: number;
}

interface VideoDimensions {
  width: number;
  height: number;
}

export class FFmpegConverter {
  private ffmpeg: FFmpeg | null = null;
  private loaded = false;
  private startTime: number | null = null;
  private abortController: AbortController | null = null;

  async load() {
    if (this.loaded) return;

    try {
      this.ffmpeg = new FFmpeg();

      await this.ffmpeg.load({
        coreURL: await toBlobURL('/ffmpeg/ffmpeg-core.js', "text/javascript"),
        wasmURL: await toBlobURL('/ffmpeg/ffmpeg-core.wasm', "application/wasm"),
      });

      this.loaded = true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('FFmpeg.terminate()')) {
        return;
      }
      throw error;
    }
  }

  async convertToVideo(
    file: File,
    onProgress: (progress: ConversionProgress) => void,
    dimensions: VideoDimensions
  ): Promise<Blob | null> {
    try {
      if (!this.loaded) {
        await this.load();
      }

      if (!this.ffmpeg) throw new Error('FFmpeg not loaded');

      // Create new abort controller for this conversion
      this.abortController = new AbortController();
      const signal = this.abortController.signal;

      // Get file extension and create appropriate input filename
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'mp3';
      const inputFileName = `input.${fileExtension}`;

      // Write the input file to FFmpeg's virtual filesystem
      await this.ffmpeg.writeFile(inputFileName, await fetchFile(file));

      // Reset timing variables
      this.startTime = Date.now();

      // Set up progress handler
      this.ffmpeg.on("progress", ({ progress }: { progress: number }) => {
        if (signal.aborted) {
          this.ffmpeg?.terminate();
          return;
        }

        const progressInfo: ConversionProgress = {
          progress: progress * 100,
          elapsedSeconds: Math.floor((Date.now() - this.startTime!) / 1000)
        };

        // Calculate remaining time
        if (this.startTime) {
          const elapsedTime = (Date.now() - this.startTime) / 1000; // in seconds
          const totalTime = elapsedTime / progress; // total estimated time
          const remaining = Math.ceil(totalTime - elapsedTime);
          if (remaining > 0 && remaining < 7200) { // Only show if less than 2 hours
            progressInfo.remainingSeconds = remaining;
          }
        }

        onProgress(progressInfo);
      });

      // Check for abort before each major operation
      if (signal.aborted) {
        this.ffmpeg.terminate();
        return null;
      }

      // Get audio duration using ffprobe
      await this.ffmpeg.exec([
        '-i', inputFileName,
        '-f', 'null',
        '-'
      ]);

      if (signal.aborted) {
        this.ffmpeg.terminate();
        return null;
      }

      // Run FFmpeg command to create video with specified dimensions
      await this.ffmpeg.exec([
        '-f', 'lavfi',
        '-i', `color=c=black:s=${dimensions.width}x${dimensions.height}:d=999999999`,
        '-i', inputFileName,
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-tune', 'zerolatency',
        '-crf', '35',
        '-c:a', 'aac', // Convert audio to AAC for better compatibility
        '-b:a', '192k', // Set audio bitrate
        '-shortest',
        'output.mp4'
      ]);

      if (signal.aborted) {
        this.ffmpeg.terminate();
        return null;
      }

      // Read the output file
      const data = await this.ffmpeg.readFile('output.mp4');
      return new Blob([data], { type: 'video/mp4' });
    } catch (error) {
      if (error instanceof Error && error.message.includes('FFmpeg.terminate()')) {
        return null;
      }
      throw error;
    } finally {
      if (this.abortController?.signal.aborted) {
        this.ffmpeg?.terminate();
      }
      this.abortController = null;
    }
  }

  abort() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      this.ffmpeg?.terminate();
      this.loaded = false; // Reset loaded state after termination
    }
  }
} 