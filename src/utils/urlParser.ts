import { ParsedVideoSource } from '../types';

export function parseVideoUrl(rawUrl: string): ParsedVideoSource {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { type: 'unsupported', isEmbeddable: false };
  }

  const trimmed = rawUrl.trim();

  // 1. YouTube URLs (standard, shorts, embed, youtu.be)
  const ytMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: 'youtube',
      id: videoId,
      // Autoplay, loop, no branding, hide related videos
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1&playsinline=1`,
      titleSuggestion: `YouTube Video (${videoId})`,
      isEmbeddable: true,
    };
  }

  // 2. Vimeo URLs
  const vimeoMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|video\/|)(\d+)/);
  if (vimeoMatch && vimeoMatch[2]) {
    const videoId = vimeoMatch[2];
    return {
      type: 'vimeo',
      id: videoId,
      embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1&title=0&byline=0&portrait=0`,
      titleSuggestion: `Vimeo Video (${videoId})`,
      isEmbeddable: true,
    };
  }

  // 3. Google Drive video preview
  const driveMatch = trimmed.match(/drive\.google\.com\/(?:file\/d\/([a-zA-Z0-9_-]+)|open\?id=([a-zA-Z0-9_-]+))/);
  if (driveMatch) {
    const fileId = driveMatch[1] || driveMatch[2];
    return {
      type: 'drive',
      id: fileId,
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      titleSuggestion: `Google Drive Video`,
      isEmbeddable: true,
    };
  }

  // 4. Direct video stream or file URL (MP4, WebM, MOV, blob:, data:video/)
  const isVideoExt = /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(trimmed);
  const isDataOrBlobVideo = trimmed.startsWith('data:video/') || trimmed.startsWith('blob:');

  if (isVideoExt || isDataOrBlobVideo) {
    const fileName = trimmed.split('/').pop()?.split('?')[0] || 'Direct Video';
    return {
      type: 'direct',
      streamUrl: trimmed,
      titleSuggestion: fileName,
      isEmbeddable: false, // will use native <video> element
    };
  }

  // 5. Generic file (PDF, audio, document)
  const isPdf = /\.pdf(\?.*)?$/i.test(trimmed) || trimmed.startsWith('data:application/pdf');
  const isAudio = /\.(mp3|wav|ogg|aac|m4a)(\?.*)?$/i.test(trimmed) || trimmed.startsWith('data:audio/');

  return {
    type: 'generic-file',
    streamUrl: trimmed,
    titleSuggestion: isPdf ? 'PDF Document' : isAudio ? 'Audio Stream' : 'File Asset',
    isEmbeddable: false,
  };
}
