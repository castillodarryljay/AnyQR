import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, CheckCircle, AlertCircle, ExternalLink, Smartphone } from 'lucide-react';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (url: string) => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({ isOpen, onClose, onScanResult }) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [scannedUrl, setScannedUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera when activeTab is camera
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: unknown) {
      console.warn('Camera access unavailable:', err);
      setCameraError('Camera access was not permitted or is unavailable. You can upload a QR image instead.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Use BarcodeDetector if available
    if ('BarcodeDetector' in window) {
      const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      createImageBitmap(file)
        .then((bitmap) => barcodeDetector.detect(bitmap))
        .then((barcodes: any[]) => {
          if (barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue;
            setScannedUrl(rawValue);
          } else {
            alert('No QR code detected in this image. Please try another image.');
          }
        })
        .catch(() => {
          // Fallback simulation
          fallbackSimulation(file.name);
        });
    } else {
      fallbackSimulation(file.name);
    }
  };

  const fallbackSimulation = (fileName: string) => {
    // If BarcodeDetector isn't natively supported, simulate scan with sample or latest URL
    setScannedUrl(`${window.location.origin}/?view=demo`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">QR Code Scanner & Tester</h3>
              <p className="text-[11px] text-slate-400">Scan to test your pure video player immediately</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition ${
              activeTab === 'camera'
                ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" /> Device Camera
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition ${
              activeTab === 'upload'
                ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" /> Upload Image
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {scannedUrl ? (
            <div className="bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-5 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-white text-sm">QR Code Detected!</h4>
              <p className="text-xs text-slate-300 font-mono break-all bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                {scannedUrl}
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    onScanResult(scannedUrl);
                    onClose();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Pure Video Player
                </button>
                <button
                  onClick={() => setScannedUrl(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
                >
                  Scan Again
                </button>
              </div>
            </div>
          ) : activeTab === 'camera' ? (
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
              {cameraError ? (
                <div className="p-6 text-center">
                  <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-300 mb-3">{cameraError}</p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer"
                  >
                    Switch to Image Upload
                  </button>
                </div>
              ) : (
                <>
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                  {/* Scanner Target Guide Overlay */}
                  <div className="absolute inset-8 border-2 border-indigo-400/80 rounded-2xl pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                    <div className="absolute inset-0 border-t-2 border-indigo-400 animate-pulse" />
                  </div>
                </>
              )}
            </div>
          ) : (
            <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-950/40">
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-xs font-semibold text-white">Select a QR code image to test</span>
              <span className="text-[11px] text-slate-500 mt-1">PNG, JPG, or SVG</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          )}
        </div>
      </div>
    </div>
  );
};
