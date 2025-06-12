import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PillInput from "@/components/ui/pillInput";
import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";

interface YouTubeMetadataFormProps {
  title: string;
  description: string;
  tags: string[];
  isPrivate: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onTagsChange: (values: string[]) => void;
  onPrivacyChange: (isPrivate: boolean) => void;
}

export function YouTubeMetadataForm({
  title,
  description,
  tags,
  isPrivate,
  onTitleChange,
  onDescriptionChange,
  onTagsChange,
  onPrivacyChange,
}: YouTubeMetadataFormProps) {
  return (
    <div className="space-y-4 mb-4">
      <div className="space-y-2">
        <Label htmlFor="youtube-title">Video Title</Label>
        <Input
          id="youtube-title"
          placeholder="Enter video title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="youtube-description">Video Description</Label>
        <textarea
          id="youtube-description"
          placeholder="Enter video description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive min-h-[100px] resize-y"
        />
      </div>

      <PillInput
        id="youtube-tags"
        label="Video Tags"
        placeholder="Type and press Enter to add tags"
        onChange={onTagsChange}
        initialValues={tags}
      />

      <div className="flex items-center space-x-2">
        <Checkbox
          id="youtube-privacy"
          checked={isPrivate}
          onCheckedChange={(checked) => onPrivacyChange(checked as boolean)}
        />
        <Label htmlFor="youtube-privacy">Make video private</Label>
      </div>
    </div>
  );
} 