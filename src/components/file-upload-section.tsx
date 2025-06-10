import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadItemProgress,
  FileUploadList,
  type FileUploadProps,
  FileUploadTrigger,
} from "@/components/ui/file-upload";
import { Download, Upload, X } from "lucide-react";
import { FileValidator } from "@/modules/validation/file-validator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type Resolution = "1080p" | "720p" | "480p";
type AspectRatio = "16:9" | "4:3" | "1:1";

interface FileUploadSectionProps {
  files: File[];
  setFiles: (files: File[]) => void;
  isConverting: boolean;
  remainingSeconds: number | null;
  convertedBlob: Blob | null;
  autoDownload: boolean;
  setAutoDownload: (value: boolean) => void;
  onFileValidate: (file: File) => string | null;
  onFileReject: (file: File, message: string) => void;
  onUpload: NonNullable<FileUploadProps["onUpload"]>;
  onDelete: () => void;
  onDownload: () => void;
  resolution: Resolution;
  setResolution: (resolution: Resolution) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (aspectRatio: AspectRatio) => void;
  startTime: number;
}

export function FileUploadSection({
  files,
  setFiles,
  isConverting,
  remainingSeconds,
  convertedBlob,
  autoDownload,
  setAutoDownload,
  onFileValidate,
  onFileReject,
  onUpload,
  onDelete,
  onDownload,
  resolution,
  setResolution,
  aspectRatio,
  setAspectRatio,
  startTime,
}: FileUploadSectionProps) {
  return (
    <div className="flex-1">
      <FileUpload.Root
        value={files}
        onValueChange={setFiles}
        onFileValidate={onFileValidate}
        onFileReject={onFileReject}
        onUpload={onUpload}
        maxFiles={1}
        className="w-full"
        accept={FileValidator.getAcceptedTypes()}
        disabled={isConverting || files.length > 0}
      >
        <FileUploadDropzone>
          <div className="flex flex-col items-center gap-1 text-center">
            <div className="flex items-center justify-center rounded-full border p-2.5">
              <Upload className="size-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-sm">
              {isConverting ? "Converting..." : files.length > 0 ? "File uploaded" : "Drag & drop an audio file here"}
            </p>
            <p className="text-muted-foreground text-xs">
              {isConverting ? "Please wait..." : files.length > 0 ? "Remove current file to upload another" : "Or click to browse (MP3, WAV, FLAC, OGG, etc.)"}
            </p>
          </div>
          <FileUploadTrigger asChild>
            <Button variant="outline" size="sm" className="mt-2 w-fit" disabled={isConverting || files.length > 0}>
              Browse files
            </Button>
          </FileUploadTrigger>
        </FileUploadDropzone>
        
        <FileUploadList>
          {files.map((file, index) => (
            <FileUploadItem key={index} value={file} className="flex-col">
              <div className="flex w-full items-center gap-2">
                <FileUploadItemPreview />
                <FileUploadItemMetadata />
                <div className="flex items-center gap-1">
                  {!isConverting && convertedBlob && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-7"
                      onClick={onDownload}
                      title="Download converted video"
                    >
                      <Download className="size-4" />
                    </Button>
                  )}
                  <FileUploadItemDelete asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-7"
                      onClick={onDelete}
                    >
                      <X />
                    </Button>
                  </FileUploadItemDelete>
                </div>
              </div>
              {isConverting && <FileUploadItemProgress />}
              {isConverting && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Converting to video... {remainingSeconds !== null && (
                    <>
                      {remainingSeconds < 60 
                        ? `(${remainingSeconds}s remaining)`
                        : `(${Math.floor(remainingSeconds / 60)}m ${remainingSeconds % 60}s remaining)`}
                      {startTime > 0 && ` - Elapsed: ${Math.floor((Date.now() - startTime) / 1000)}s`}
                    </>
                  )}
                </div>
              )}
            </FileUploadItem>
          ))}
        </FileUploadList>
      </FileUpload.Root>

      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="resolution">Resolution</Label>
            <Select value={resolution} onValueChange={(value) => setResolution(value as Resolution)}>
              <SelectTrigger id="resolution">
                <SelectValue placeholder="Select resolution" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1080p">1080p (1920x1080)</SelectItem>
                <SelectItem value="720p">720p (1280x720)</SelectItem>
                <SelectItem value="480p">480p (854x480)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
            <Select value={aspectRatio} onValueChange={(value) => setAspectRatio(value as AspectRatio)}>
              <SelectTrigger id="aspect-ratio">
                <SelectValue placeholder="Select aspect ratio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                <SelectItem value="1:1">1:1 (Square)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="auto-download" 
            checked={autoDownload}
            onCheckedChange={(checked) => setAutoDownload(checked as boolean)}
          />
          <label
            htmlFor="auto-download"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Automatically download converted video
          </label>
        </div>
      </div>
    </div>
  );
} 