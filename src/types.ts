export type MediaType = 'video' | 'file';

export type SourceType = 'url' | 'upload' | 'embed';

export interface QrStyleOptions {
  foregroundColor: string;
  backgroundColor: string;
  margin: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  dotStyle: 'squares' | 'rounded' | 'dots';
  showCenterLogo: boolean;
  frameTitle?: string;
}

export interface PlayerSettings {
  autoPlay: boolean;
  loop: boolean;
  muted: boolean;
  cinemaMode: boolean; // Hide all metadata, purely the video player
  allowDownload: boolean;
  accentGlow: boolean;
}

export interface QrItem {
  id: string;
  userId: string;
  userEmail?: string;
  title: string;
  description?: string;
  type: MediaType;
  sourceType: SourceType;
  url: string;
  originalFileName?: string;
  fileType: string;
  fileSize: number;
  viewsCount: number;
  qrStyle: QrStyleOptions;
  playerSettings: PlayerSettings;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string;
}

export interface ParsedVideoSource {
  type: 'direct' | 'youtube' | 'vimeo' | 'drive' | 'generic-file' | 'unsupported';
  embedUrl?: string;
  streamUrl?: string;
  id?: string;
  titleSuggestion?: string;
  isEmbeddable: boolean;
}
