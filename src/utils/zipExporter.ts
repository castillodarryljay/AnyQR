import JSZip from 'jszip';
import { QrItem } from '../types';
import { generateQrDataUrl } from './qrGenerator';

export async function exportAllCodesToZip(
  userItems: QrItem[],
  onProgress?: (status: string) => void
): Promise<void> {
  const zip = new JSZip();

  onProgress?.('Preparing source files...');

  // 1. Root documentation & info
  zip.file(
    'README.md',
    `# StreamQR - Video to QR Generator & Pure Player

Convert any video URL or file into customized QR codes with instant, distraction-free pure video playback, Firebase cloud sync, project manager, and ZIP code exporter.

## Key Features
- **Pure Cinema Player**: Scanning the QR code opens the video in a zero-distraction, pure immersive player mode.
- **Universal Video Support**: Works with YouTube, Vimeo, Google Drive video previews, MP4, WebM, MOV, and direct video files.
- **Custom QR Generator**: High-resolution PNG and SVG exports, custom brand colors, error correction, center video play badges.
- **Firebase Auth & Firestore**: Google Sign-in to sync your QR projects across devices with live scan analytics.
- **ZIP Exporter**: Full code bundling and QR code package exporter.

## Quick Start
1. Install dependencies: \`npm install\`
2. Run development server: \`npm run dev\`
3. Build for production: \`npm run build\`

## Firebase Deployment
Deploy security rules:
\`firebase deploy --only firestore:rules\`
`
  );

  // 2. Standalone Offline Video Player HTML
  zip.file(
    'standalone-video-player.html',
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StreamQR Pure Cinema Player (Offline Edition)</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #000;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
    }
    .video-container {
      position: relative;
      width: 100vw;
      height: 100vh;
      max-width: 100%;
      max-height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #000;
    }
    video, iframe {
      width: 100%;
      height: 100%;
      max-width: 100vw;
      max-height: 100vh;
      object-fit: contain;
      border: none;
    }
    .top-controls {
      position: absolute;
      top: 16px;
      left: 16px;
      right: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 50;
      opacity: 0;
      transition: opacity 0.3s ease;
      background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
      padding: 12px 16px;
      border-radius: 12px;
    }
    .video-container:hover .top-controls {
      opacity: 1;
    }
    .btn {
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.2);
      color: #fff;
      padding: 8px 16px;
      border-radius: 9999px;
      font-size: 13px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="video-container" id="playerStage">
    <div class="top-controls">
      <div id="videoTitle">StreamQR Pure Cinema Player</div>
      <button class="btn" onclick="toggleFullscreen()">Fullscreen</button>
    </div>
    <video id="videoElement" controls autoplay playsinline loop></video>
  </div>
  <script>
    const params = new URLSearchParams(window.location.search);
    const videoUrl = params.get('url') || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    const videoEl = document.getElementById('videoElement');
    videoEl.src = videoUrl;

    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  </script>
</body>
</html>`
  );

  // 3. Configuration & Schema files
  zip.file(
    'firestore.rules',
    `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Default Deny
    match /{document=**} {
      allow read, write: if false;
    }
    // Public read and creator writes for QR items
    match /qr_items/{qrId} {
      allow get: if resource.data.isPublic == true || (request.auth != null && resource.data.userId == request.auth.uid);
      allow list: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if (request.auth != null && resource.data.userId == request.auth.uid) || (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['viewsCount', 'updatedAt']));
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`
  );

  zip.file(
    'package.json',
    JSON.stringify(
      {
        name: 'stream-qr-video-converter',
        version: '1.0.0',
        private: true,
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview',
        },
        dependencies: {
          firebase: '^11.4.0',
          qrcode: '^1.5.4',
          jszip: '^3.10.1',
          'lucide-react': '^0.546.0',
          react: '^19.0.1',
          'react-dom': '^19.0.1',
          motion: '^12.23.24',
        },
      },
      null,
      2
    )
  );

  // 4. Source codes
  const srcFolder = zip.folder('src');
  if (srcFolder) {
    srcFolder.file(
      'types.ts',
      `export type MediaType = 'video' | 'file';
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
  cinemaMode: boolean;
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
}`
    );
  }

  // 5. Generate high-res QR Code images for each project in user's library
  onProgress?.('Generating high-resolution QR codes...');
  const qrFolder = zip.folder('my-qr-codes');
  const manifestData: Record<string, unknown>[] = [];

  const origin = window.location.origin;

  for (let i = 0; i < userItems.length; i++) {
    const item = userItems[i];
    const targetUrl = `${origin}/?view=${item.id}`;
    try {
      const dataUrl = await generateQrDataUrl(targetUrl, item.qrStyle, 1024);
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
      const safeTitle = item.title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
      const fileName = `${i + 1}_${safeTitle}_qr.png`;

      qrFolder?.file(fileName, base64Data, { base64: true });

      manifestData.push({
        index: i + 1,
        id: item.id,
        title: item.title,
        qrFileName: fileName,
        viewUrl: targetUrl,
        videoSource: item.url,
        viewsCount: item.viewsCount,
        createdAt: item.createdAt,
      });
    } catch (err) {
      console.warn(`Failed to generate QR for item ${item.id}:`, err);
    }
  }

  qrFolder?.file('manifest.json', JSON.stringify(manifestData, null, 2));

  onProgress?.('Compressing ZIP archive...');
  const blob = await zip.generateAsync({ type: 'blob' });

  // Trigger download
  const blobUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = blobUrl;
  downloadLink.download = `StreamQR_All_Codes_And_Projects_${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(blobUrl);

  onProgress?.('Done!');
}
