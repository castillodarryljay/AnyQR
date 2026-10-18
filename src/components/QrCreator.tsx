import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  FileUp,
  Link,
  Sparkles,
  Download,
  Copy,
  Check,
  Play,
  Share2,
  Sliders,
  Save,
  Eye,
  FileText,
  Info,
  Maximize2
} from 'lucide-react';
import { User } from 'firebase/auth';
import { QrItem, QrStyleOptions, PlayerSettings } from '../types';
import { parseVideoUrl } from '../utils/urlParser';
import { generateQrDataUrl, generateQrSvgString, downloadDataUrl } from '../utils/qrGenerator';
import { QrCustomizer } from './QrCustomizer';
import { saveQrItem } from '../firebase';

interface QrCreatorProps {
  user: User | null;
  onSaveSuccess: (item: QrItem) => void;
  onOpenPlayer: (item: QrItem) => void;
  onRequireAuth: () => void;
}

const VIDEO_PRESETS = [
  {
    name: 'Nature 4K (Big Buck Bunny)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    type: 'video' as const,
    title: 'Big Buck Bunny Nature Showcase',
  },
  {
    name: 'Sintel Animated Film',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    type: 'video' as const,
    title: 'Sintel Open Movie',
  },
  {
    name: 'Tears of Steel Sci-Fi',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    type: 'video' as const,
    title: 'Tears of Steel VFX Reel',
  },
  {
    name: 'YouTube Showcase',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    type: 'video' as const,
    title: 'YouTube Music Showcase',
  },
];

export const QrCreator: React.FC<QrCreatorProps> = ({
  user,
  onSaveSuccess,
  onOpenPlayer,
  onRequireAuth,
}) => {
  const [sourceMode, setSourceMode] = useState<'url' | 'upload'>('url');
  const [rawUrl, setRawUrl] = useState<string>(
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  );
  const [title, setTitle] = useState<string>('Sample Video QR');
  const [description, setDescription] = useState<string>('Scan to play this video in pure cinema mode');
  const [mediaType, setMediaType] = useState<'video' | 'file'>('video');
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    type: string;
    url: string;
  } | null>(null);

  // QR Style & Player Options
  const [qrStyle, setQrStyle] = useState<QrStyleOptions>({
    foregroundColor: '#4f46e5',
    backgroundColor: '#ffffff',
    margin: 2,
    errorCorrectionLevel: 'H',
    dotStyle: 'rounded',
    showCenterLogo: true,
  });

  const [playerSettings, setPlayerSettings] = useState<PlayerSettings>({
    autoPlay: true,
    loop: true,
    muted: false,
    cinemaMode: true,
    allowDownload: true,
    accentGlow: true,
  });

  // Generated QR output state
  const [generatedQrUrl, setGeneratedQrUrl] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [currentId, setCurrentId] = useState<string>(() => 'qr_' + Math.random().toString(36).substring(2, 9));

  // Determine current effective URL
  const effectiveUrl = sourceMode === 'upload' && uploadedFile ? uploadedFile.url : rawUrl;
  const parsedSource = parseVideoUrl(effectiveUrl);

  // Regenerate target share URL
  const targetScanUrl = `${window.location.origin}/?view=${currentId}`;

  // Re-render QR code whenever target URL or style changes
  useEffect(() => {
    let isCancelled = false;
    generateQrDataUrl(targetScanUrl, qrStyle, 800)
      .then((dataUrl) => {
        if (!isCancelled) setGeneratedQrUrl(dataUrl);
      })
      .catch(console.error);

    return () => {
      isCancelled = true;
    };
  }, [targetScanUrl, qrStyle]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/');

    setUploadedFile({
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      url: objectUrl,
    });

    setTitle(file.name.replace(/\.[^/.]+$/, ''));
    setMediaType(isVideo ? 'video' : 'file');
  };

  const handleSaveToCloud = async () => {
    if (!user) {
      onRequireAuth();
      return;
    }

    if (!effectiveUrl) {
      alert('Please provide a video URL or upload a file first.');
      return;
    }

    setIsSaving(true);
    try {
      const newItem: QrItem = {
        id: currentId,
        userId: user.uid,
        userEmail: user.email || '',
        title: title || 'Untitled Video QR',
        description: description || '',
        type: mediaType,
        sourceType: sourceMode,
        url: effectiveUrl,
        originalFileName: uploadedFile?.name,
        fileType: uploadedFile?.type || (mediaType === 'video' ? 'video/mp4' : 'application/octet-stream'),
        fileSize: uploadedFile?.size || 0,
        viewsCount: 0,
        qrStyle,
        playerSettings,
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveQrItem(newItem);
      onSaveSuccess(newItem);
      // Generate a new ID for the next item
      setCurrentId('qr_' + Math.random().toString(36).substring(2, 9));
    } catch (err) {
      console.error('Failed to save QR item:', err);
      alert('Failed to save to Firebase Firestore. Please check your network.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestPurePlayer = () => {
    const previewItem: QrItem = {
      id: currentId,
      userId: user?.uid || 'guest',
      title: title || 'Pure Video Player Preview',
      description,
      type: mediaType,
      sourceType: sourceMode,
      url: effectiveUrl,
      fileType: uploadedFile?.type || 'video/mp4',
      fileSize: uploadedFile?.size || 0,
      viewsCount: 0,
      qrStyle,
      playerSettings,
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onOpenPlayer(previewItem);
  };

  const handleDownloadPng = () => {
    if (generatedQrUrl) {
      const fileName = `${title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'video'}_qr.png`;
      downloadDataUrl(generatedQrUrl, fileName);
    }
  };

  const handleDownloadSvg = async () => {
    try {
      const svgString = await generateQrSvgString(targetScanUrl, qrStyle);
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const fileName = `${title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'video'}_qr.svg`;
      downloadDataUrl(url, fileName);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export SVG:', err);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetScanUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Input, Customization, Player Settings (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        {/* Step 1: Video / File Ingestion Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Video className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-base text-white">1. Select Video or File Source</h2>
            </div>
            {/* Source Switcher */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setSourceMode('url')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  sourceMode === 'url' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Link className="w-3.5 h-3.5" /> Paste URL
              </button>
              <button
                type="button"
                onClick={() => setSourceMode('upload')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  sourceMode === 'upload' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileUp className="w-3.5 h-3.5" /> Upload File
              </button>
            </div>
          </div>

          {sourceMode === 'url' ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Paste Video URL (YouTube, Vimeo, Google Drive, MP4, WebM, etc.)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={rawUrl}
                    onChange={(e) => {
                      setRawUrl(e.target.value);
                      const parsed = parseVideoUrl(e.target.value);
                      if (parsed.titleSuggestion && title === 'Sample Video QR') {
                        setTitle(parsed.titleSuggestion);
                      }
                    }}
                    placeholder="https://example.com/video.mp4 or YouTube URL"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                  />
                  <span className="absolute right-3 top-3 text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {parsedSource.type.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Ready Presets */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-semibold text-slate-400">Instant Demo Videos (Click to Test):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {VIDEO_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setRawUrl(preset.url);
                        setTitle(preset.title);
                        setMediaType(preset.type);
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-950/80 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-white transition cursor-pointer"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-950/40">
                <FileUp className="w-8 h-8 text-indigo-400 mb-2" />
                <span className="text-sm font-semibold text-white">Click or drag & drop video or file</span>
                <span className="text-xs text-slate-400 mt-1">MP4, WebM, MOV, PDF, Audio, or any document</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept="video/*,audio/*,.pdf,.doc,.docx"
                  className="hidden"
                />
              </label>

              {uploadedFile && (
                <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white block line-clamp-1">
                        {uploadedFile.name}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • {uploadedFile.type}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Ready
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Metadata Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Project / Video Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cinematic Intro 2026"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Short Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Scannable brochure promo"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Pure Cinema Player Settings */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Sliders className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-base text-white">2. Pure Player Behavior</h2>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-semibold border border-purple-500/20">
              When Scanned
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center justify-between p-3 bg-slate-950/70 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition">
              <div>
                <span className="text-xs font-semibold text-white block">AutoPlay Video</span>
                <span className="text-[11px] text-slate-400 block">Starts immediately when scanned</span>
              </div>
              <input
                type="checkbox"
                checked={playerSettings.autoPlay}
                onChange={(e) => setPlayerSettings({ ...playerSettings, autoPlay: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-950/70 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition">
              <div>
                <span className="text-xs font-semibold text-white block">Continuous Loop</span>
                <span className="text-[11px] text-slate-400 block">Repeats smoothly in loop</span>
              </div>
              <input
                type="checkbox"
                checked={playerSettings.loop}
                onChange={(e) => setPlayerSettings({ ...playerSettings, loop: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-950/70 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition">
              <div>
                <span className="text-xs font-semibold text-white block">Pure Cinema Mode</span>
                <span className="text-[11px] text-slate-400 block">Hide chrome & clutter</span>
              </div>
              <input
                type="checkbox"
                checked={playerSettings.cinemaMode}
                onChange={(e) => setPlayerSettings({ ...playerSettings, cinemaMode: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-950/70 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition">
              <div>
                <span className="text-xs font-semibold text-white block">Ambient Glow Effect</span>
                <span className="text-[11px] text-slate-400 block">Dynamic cinema backlight</span>
              </div>
              <input
                type="checkbox"
                checked={playerSettings.accentGlow}
                onChange={(e) => setPlayerSettings({ ...playerSettings, accentGlow: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
              />
            </label>
          </div>
        </div>

        {/* Step 3: QR Customization */}
        <QrCustomizer options={qrStyle} onChange={setQrStyle} />
      </div>

      {/* Right Column: Live QR Preview & Actions (5 cols) */}
      <div className="lg:col-span-5 sticky top-20 space-y-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md flex flex-col items-center text-center">
          <div className="w-full flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Live QR Preview</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Scannable 4K
            </span>
          </div>

          {/* QR Code Canvas Card */}
          <div
            className="p-4 rounded-2xl shadow-2xl border border-slate-700/50 transition-all duration-300"
            style={{ backgroundColor: qrStyle.backgroundColor }}
          >
            {generatedQrUrl ? (
              <img
                src={generatedQrUrl}
                alt="Generated Video QR Code"
                className="w-64 h-64 sm:w-72 sm:h-72 object-contain rounded-lg"
              />
            ) : (
              <div className="w-64 h-64 bg-slate-800 rounded-lg animate-pulse" />
            )}
          </div>

          <p className="text-xs font-semibold text-white mt-4">{title || 'Video QR'}</p>
          <p className="text-[11px] text-slate-400 max-w-xs mt-0.5 line-clamp-1">
            Scan to experience pure distraction-free video playback
          </p>

          {/* Target URL with Copy Button */}
          <div className="w-full mt-4 flex items-center gap-2 p-2 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-mono truncate flex-1 text-left pl-2">
              {targetScanUrl}
            </span>
            <button
              onClick={handleCopyLink}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1 transition cursor-pointer shrink-0"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="w-full mt-5 space-y-2.5">
            {/* Test Pure Player */}
            <button
              type="button"
              onClick={handleTestPurePlayer}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs tracking-wide uppercase flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" /> Test Pure Cinema Player Now
            </button>

            {/* Save to Cloud Firebase */}
            <button
              type="button"
              onClick={handleSaveToCloud}
              disabled={isSaving}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              {isSaving ? 'Saving to Firebase...' : user ? 'Save QR to Firebase Cloud' : 'Sign In & Save to Firebase'}
            </button>

            {/* Download Options */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadPng}
                className="py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" /> Download PNG
              </button>
              <button
                type="button"
                onClick={handleDownloadSvg}
                className="py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-purple-400" /> Download SVG
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
