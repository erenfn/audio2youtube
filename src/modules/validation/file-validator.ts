export const MAX_FILES = 1;
export const MAX_SIZE = 100 * 1024 * 1024; // 100MB
export const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',           // .mp3
  'audio/wav',            // .wav
  'audio/ogg',            // .ogg
  'audio/mp4',            // .m4a
  'audio/aac',            // .aac
  'audio/x-aac',          // .aac (alternative MIME type)
  'audio/aacp',           // .aac (another alternative)
  'audio/webm',           // .webm
  'audio/x-m4a',          // .m4a (alternative MIME type)
  'audio/x-wav',          // .wav (alternative MIME type)
  'audio/flac',           // .flac
  'audio/x-flac',         // .flac (alternative MIME type)
  'audio/x-mpeg',         // .aac (some systems use this)
  'audio/mp4a-latm',      // .aac (another variant)
  'audio/aac-adts',       // .aac (ADTS format)
  'audio/vnd.dlna.adts',  // .aac (DLNA ADTS format)
  'audio/vnd.dlna.adts.aac', // .aac (another DLNA format)
  'audio/vnd.dlna.adts.aacp', // .aac (another DLNA format)
];

export class FileValidator {
  constructor(
    private currentFiles: File[],
    private maxFiles: number = MAX_FILES,
    private maxSize: number = MAX_SIZE,
    private allowedTypes: string[] = ALLOWED_AUDIO_TYPES
  ) {}

  validate(file: File): string | null {
    // Validate max files
    if (this.currentFiles.length >= this.maxFiles) {
      return `You can only upload ${this.maxFiles} audio file${this.maxFiles > 1 ? 's' : ''}`;
    }

    // Validate file type (only audio files)
    const fileTypeLower = file.type.toLowerCase();
    const allowedTypesLower = this.allowedTypes.map(type => type.toLowerCase());
    const isAllowed = allowedTypesLower.includes(fileTypeLower);

    if (!isAllowed) {
      return `Only audio files are allowed. Received type: ${file.type}`;
    }

    // Validate file size
    if (file.size > this.maxSize) {
      return `File size must be less than ${this.maxSize / (1024 * 1024)}MB`;
    }

    return null;
  }

  static getAcceptedTypes(): string {
    return ALLOWED_AUDIO_TYPES.join(',');
  }
} 