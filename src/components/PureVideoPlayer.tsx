import React, { useEffect, useState, useRef } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCcw,
  Download,
  Share2,
  Info,
  X,
  QrCode,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { QrItem } from '../types';
import { parseVideoUrl } from '../utils/urlParser';
import { incrementQrViews, getQrItem } from '../firebase';
import { generateQrDataUrl } from '../utils/qrGenerator';

interface PureVideoPlayerProps {
  itemId?: string;
  initialItem?: QrItem | null;
  onBackToStudio?: () => void;
}

export const PureVideoPlayer: React.FC<PureVideoPlayerProps> = ({
  itemId,
  initialItem,
  onBackToStudio,
}) => {
  const [item, setItem] = useState<QrItem | null>(initialItem || null);
  const [loading, setLoading] = useState<boolean>(!initialItem);
  const [error, setError] = useState<string | null>(null);

  // Playback states
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showInfoPanel, setShowInfoPanel] = useState<boolean>(false);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);
  const [unmutePrompt, setUnmutePrompt] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);

  // Fetch item if only itemId provided
  useEffect(() => {
    async function loadItem() {
      if (!itemId) return;
      try {
        setLoading(true);
        const data = await getQrItem(itemId);
        if (data) {
          setItem(data);
          // Increment views
          incrementQrViews(data.id, data.viewsCount || 0);
        } else {
          setError('Video not found or link has expired.');
        }
      } catch (err) {
        console.error('Error loading QR item:', err);
        setError('Unable to load video.');
      } finally {
        setLoading(false);
      }
    }

    if (!initialItem && itemId) {
      loadItem();
    }
  }, [itemId, initialItem]);

  // Generate QR code for sharing
  useEffect(() => {
    if (item) {
      const currentUrl = window.location.href;
      generateQrDataUrl(currentUrl, item.qrStyle, 400).then(setQrPreviewUrl);
    }
  }, [item]);

  // Autohide controls logic
  const resetHideTimer = () => {
    setShowControls(true);
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    hideControlsTimeout.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 2400);
  };

  useEffect(() => {
    const handleMouseMove = () => resetHideTimer();
    const handleTouchStart = () => resetHideTimer();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouchStart);

    resetHideTimer();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
    };
  }, [isPlaying]);

  // Listen to fullscreen changes
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMute();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
    setUnmutePrompt(false);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white z-50">
        <div className="w-12 h-12 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm tracking-wide font-medium">Opening Pure Video Player...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white p-6 z-50">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-400">
          <X className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-2 text-white">Video Unavailable</h2>
        <p className="text-slate-400 text-sm max-w-md text-center mb-6">{error || 'This video could not be loaded.'}</p>
        {onBackToStudio && (
          <button
            onClick={onBackToStudio}
            className="px-5 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-sm font-medium transition flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Go to StreamQR Creator
          </button>
        )}
      </div>
    );
  }

  const parsedSource = parseVideoUrl(item.url);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-hidden flex items-center justify-center select-none"
    >
      {/* Dynamic Ambient Background Glow */}
      <div className="absolute inset-0 pointer-events-none opacity-20 blur-3xl bg-gradient-to-tr from-indigo-900/40 via-purple-900/20 to-black" />

      {/* Pure Video Stage */}
      <div className="relative w-full h-full flex items-center justify-center">
        {parsedSource.isEmbeddable && parsedSource.embedUrl ? (
          /* Iframe Embed (YouTube / Vimeo / Google Drive) */
          <iframe
            src={parsedSource.embedUrl}
            title={item.title}
            className="w-full h-full border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : item.type === 'video' ? (
          /* Direct HTML5 Video Player */
          <video
            ref={videoRef}
            src={parsedSource.streamUrl || item.url}
            className="w-full h-full object-contain cursor-pointer"
            autoPlay={item.playerSettings?.autoPlay ?? true}
            loop={item.playerSettings?.loop ?? true}
            muted={item.playerSettings?.muted ?? false}
            playsInline
            onClick={togglePlay}
            onTimeUpdate={() => {
              if (videoRef.current) {
                setCurrentTime(videoRef.current.currentTime);
                setDuration(videoRef.current.duration || 0);
              }
            }}
            onLoadedMetadata={() => {
              if (videoRef.current) {
                setDuration(videoRef.current.duration || 0);
                videoRef.current.play().catch(() => {
                  // If browser blocked unmuted autoplay, mute and retry, then show unmute prompt
                  if (videoRef.current) {
                    videoRef.current.muted = true;
                    setIsMuted(true);
                    setUnmutePrompt(true);
                    videoRef.current.play().catch(() => {});
                  }
                });
              }
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        ) : (
          /* Generic File Viewer / Card */
          <div className="p-8 max-w-lg bg-slate-900/90 border border-slate-800 rounded-3xl text-center backdrop-blur-xl shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Download className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{item.title}</h2>
            <p className="text-slate-400 text-sm mb-6">
              File type: {item.fileType || 'Generic file'} • {(item.fileSize / (1024 * 1024)).toFixed(2)} MB
            </p>
            <a
              href={item.url}
              download={item.originalFileName || 'file'}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-500/25 transition cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download File
            </a>
          </div>
        )}
      </div>

      {/* Unmute Autoplay Prompt Banner (Minimalist) */}
      {unmutePrompt && (
        <button
          onClick={toggleMute}
          className="absolute top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-indigo-600/90 hover:bg-indigo-500 backdrop-blur-md rounded-full text-white text-xs font-semibold flex items-center gap-2 shadow-xl animate-bounce cursor-pointer"
        >
          <VolumeX className="w-4 h-4" /> Video is playing muted. Click to Unmute Audio
        </button>
      )}

      {/* Top Floating Bar: Minimalist Title & Info Actions (Auto-hiding) */}
      <div
        className={`absolute top-0 left-0 right-0 p-5 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 z-40 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3">
          {onBackToStudio && (
            <button
              onClick={onBackToStudio}
              title="StreamQR Creator Studio"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-white text-sm font-semibold tracking-wide drop-shadow-md line-clamp-1 max-w-md">
              {item.title}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-300 drop-shadow">
              <span>{item.viewsCount + 1} views</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <Sparkles className="w-3 h-3" /> Pure Cinema Mode
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInfoPanel(true)}
            title="Scan QR & Info"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
          </button>
          <button
            onClick={copyShareLink}
            title="Share Link"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Copied toast notification */}
      {copiedLink && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-white/90 text-slate-900 px-4 py-2 rounded-full text-xs font-semibold backdrop-blur shadow-2xl z-50">
          ✓ Link copied to clipboard
        </div>
      )}

      {/* Bottom Floating Minimalist Video Controls (Only for HTML5 direct videos) */}
      {item.type === 'video' && !parsedSource.isEmbeddable && (
        <div
          className={`absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col gap-2 transition-opacity duration-300 z-40 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Progress bar */}
          <div className="w-full flex items-center gap-3">
            <span className="text-xs text-slate-300 font-mono select-none">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-white/20 hover:bg-white/30 rounded-lg appearance-none cursor-pointer accent-indigo-500 transition-all"
            />
            <span className="text-xs text-slate-300 font-mono select-none">{formatTime(duration)}</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              <button
                onClick={() => {
                  if (videoRef.current) videoRef.current.currentTime = 0;
                }}
                title="Restart"
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-2 group">
                <button
                  onClick={toggleMute}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullscreen}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side Slide-out Info & QR Panel */}
      {showInfoPanel && (
        <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-slate-950/95 border-l border-slate-800 p-6 flex flex-col justify-between backdrop-blur-2xl z-50 shadow-2xl animate-in slide-in-from-right duration-200">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-400" /> Video Details
              </h3>
              <button
                onClick={() => setShowInfoPanel(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Title</label>
                <p className="text-sm font-medium text-slate-100 mt-0.5">{item.title}</p>
              </div>

              {item.description && (
                <div>
                  <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Description</label>
                  <p className="text-xs text-slate-300 mt-0.5">{item.description}</p>
                </div>
              )}

              {/* QR Code preview for friends to scan */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center text-center">
                <span className="text-xs font-semibold text-slate-300 mb-2">Scan to Watch This Video</span>
                {qrPreviewUrl ? (
                  <img
                    src={qrPreviewUrl}
                    alt="Video QR Code"
                    className="w-40 h-40 rounded-xl bg-white p-2 shadow-inner"
                  />
                ) : (
                  <div className="w-40 h-40 bg-slate-800 rounded-xl animate-pulse" />
                )}
                <span className="text-[11px] text-slate-500 mt-2 font-mono break-all">
                  StreamQR Pure Link
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-2">
            <button
              onClick={copyShareLink}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              <Share2 className="w-4 h-4" /> Share Video Link
            </button>
            {onBackToStudio && (
              <button
                onClick={onBackToStudio}
                className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-medium text-xs transition cursor-pointer"
              >
                Create Your Own Video QR
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
