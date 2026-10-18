/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, signOutUser, getUserQrItems } from './firebase';
import { QrItem } from './types';
import { Navbar } from './components/Navbar';
import { QrCreator } from './components/QrCreator';
import { ProjectManager } from './components/ProjectManager';
import { PureVideoPlayer } from './components/PureVideoPlayer';
import { ScannerModal } from './components/ScannerModal';
import { ZipExportModal } from './components/ZipExportModal';
import { Sparkles, Shield, CheckCircle, Video } from 'lucide-react';

const INITIAL_DEMO_ITEMS: QrItem[] = [
  {
    id: 'demo-bunny',
    userId: 'demo-system',
    userEmail: 'demo@streamqr.local',
    title: 'Nature 4K Showcase (Big Buck Bunny)',
    description: 'Ultra high-definition open cinema sample video',
    type: 'video',
    sourceType: 'url',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    fileType: 'video/mp4',
    fileSize: 158008374,
    viewsCount: 24,
    qrStyle: {
      foregroundColor: '#4f46e5',
      backgroundColor: '#ffffff',
      margin: 2,
      errorCorrectionLevel: 'H',
      dotStyle: 'rounded',
      showCenterLogo: true,
    },
    playerSettings: {
      autoPlay: true,
      loop: true,
      muted: false,
      cinemaMode: true,
      allowDownload: true,
      accentGlow: true,
    },
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-sintel',
    userId: 'demo-system',
    userEmail: 'demo@streamqr.local',
    title: 'Sintel Fantasy Film Trailer',
    description: 'Blender Foundation 4K open animation trailer',
    type: 'video',
    sourceType: 'url',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    fileType: 'video/mp4',
    fileSize: 45000000,
    viewsCount: 18,
    qrStyle: {
      foregroundColor: '#059669',
      backgroundColor: '#ffffff',
      margin: 2,
      errorCorrectionLevel: 'H',
      dotStyle: 'rounded',
      showCenterLogo: true,
    },
    playerSettings: {
      autoPlay: true,
      loop: true,
      muted: false,
      cinemaMode: true,
      allowDownload: true,
      accentGlow: true,
    },
    isPublic: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<'create' | 'projects'>('create');
  const [userItems, setUserItems] = useState<QrItem[]>(INITIAL_DEMO_ITEMS);

  // Modals & Navigation
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isZipModalOpen, setIsZipModalOpen] = useState<boolean>(false);

  // Player mode (Pure distraction-free video stage)
  const [activePlayItem, setActivePlayItem] = useState<QrItem | null>(null);
  const [urlViewId, setUrlViewId] = useState<string | null>(null);

  // Detect URL parameter on load: ?view=xyz or ?v=xyz
  useEffect(() => {
    const handleUrlCheck = () => {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view') || params.get('v');
      if (viewParam) {
        setUrlViewId(viewParam);
      } else {
        setUrlViewId(null);
      }
    };

    handleUrlCheck();
    window.addEventListener('popstate', handleUrlCheck);
    return () => window.removeEventListener('popstate', handleUrlCheck);
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        await loadUserProjects(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadUserProjects = async (uid: string) => {
    try {
      const items = await getUserQrItems(uid);
      if (items.length > 0) {
        setUserItems(items);
      } else {
        // Keep initial demos for instant testability
        setUserItems(INITIAL_DEMO_ITEMS);
      }
    } catch (err) {
      console.warn('Could not load user items from Firestore:', err);
    }
  };

  const handleSignIn = async () => {
    try {
      const signedInUser = await signInWithGoogle();
      if (signedInUser) {
        await loadUserProjects(signedInUser.uid);
      }
    } catch (err) {
      console.error('Sign-in error:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setUser(null);
      setUserItems(INITIAL_DEMO_ITEMS);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const handleSaveSuccess = (newItem: QrItem) => {
    setUserItems((prev) => [newItem, ...prev.filter((item) => item.id !== newItem.id)]);
    alert('QR project successfully saved to Firebase Cloud!');
    setActiveView('projects');
  };

  const handleOpenPurePlayer = (item: QrItem) => {
    setActivePlayItem(item);
  };

  const handleScanResult = (url: string) => {
    const parsed = new URL(url, window.location.href);
    const viewParam = parsed.searchParams.get('view') || parsed.searchParams.get('v');
    if (viewParam) {
      const found = userItems.find((i) => i.id === viewParam);
      if (found) {
        setActivePlayItem(found);
      } else {
        setUrlViewId(viewParam);
      }
    } else {
      window.open(url, '_blank');
    }
  };

  // 1. If scanned from a QR code (?view=id in URL), render Pure Minimalist Video Player immediately!
  if (urlViewId) {
    return (
      <PureVideoPlayer
        itemId={urlViewId}
        onBackToStudio={() => {
          // Clear query param and return to studio
          window.history.pushState({}, '', window.location.pathname);
          setUrlViewId(null);
        }}
      />
    );
  }

  // 2. If testing pure player inside studio
  if (activePlayItem) {
    return (
      <PureVideoPlayer
        initialItem={activePlayItem}
        onBackToStudio={() => setActivePlayItem(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        user={user}
        activeView={activeView}
        setActiveView={setActiveView}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenZipModal={() => setIsZipModalOpen(true)}
        projectCount={userItems.length}
      />

      {/* Main Studio Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Banner */}
        <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900 border border-indigo-500/20 relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> High-Resolution Video QR Studio
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Convert Any Video into a Clean, Scannable QR Code
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              When viewers scan your QR code on their phone, it launches into a <strong>pure, distraction-free cinema player</strong> with no junk or ads. Sync all projects to Firebase and download complete source codes in a ZIP file!
            </p>
          </div>

          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* View Content */}
        {activeView === 'create' ? (
          <QrCreator
            user={user}
            onSaveSuccess={handleSaveSuccess}
            onOpenPlayer={handleOpenPurePlayer}
            onRequireAuth={handleSignIn}
          />
        ) : (
          <ProjectManager
            user={user}
            items={userItems}
            onRefresh={() => user && loadUserProjects(user.uid)}
            onOpenPlayer={handleOpenPurePlayer}
            onSignIn={handleSignIn}
            onCreateNew={() => setActiveView('create')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-indigo-400" />
            <span>StreamQR • Video to QR Converter & Pure Cinema Player</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={() => setIsZipModalOpen(true)} className="hover:text-white transition cursor-pointer">
              Download Codes ZIP
            </button>
            <span>•</span>
            <button onClick={() => setIsScannerOpen(true)} className="hover:text-white transition cursor-pointer">
              Test Scan QR
            </button>
            <span>•</span>
            <span>Firestore Powered</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanResult={handleScanResult}
      />

      <ZipExportModal
        isOpen={isZipModalOpen}
        onClose={() => setIsZipModalOpen(false)}
        items={userItems}
      />
    </div>
  );
}
