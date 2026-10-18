import React, { useState } from 'react';
import {
  FolderOpen,
  Search,
  Play,
  Download,
  Copy,
  Trash2,
  ExternalLink,
  Eye,
  Check,
  Video,
  FileText,
  Calendar,
  Sparkles,
  QrCode
} from 'lucide-react';
import { User } from 'firebase/auth';
import { QrItem } from '../types';
import { deleteQrItem } from '../firebase';
import { generateQrDataUrl, downloadDataUrl } from '../utils/qrGenerator';

interface ProjectManagerProps {
  user: User | null;
  items: QrItem[];
  onRefresh: () => void;
  onOpenPlayer: (item: QrItem) => void;
  onSignIn: () => void;
  onCreateNew: () => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  user,
  items,
  onRefresh,
  onOpenPlayer,
  onSignIn,
  onCreateNew,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'video' | 'file'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this QR code?')) return;
    setDeletingId(id);
    try {
      await deleteQrItem(id);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete item:', err);
      alert('Could not delete item. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopy = (id: string) => {
    const link = `${window.location.origin}/?view=${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadQr = async (item: QrItem) => {
    const link = `${window.location.origin}/?view=${item.id}`;
    const dataUrl = await generateQrDataUrl(link, item.qrStyle, 1024);
    const fileName = `${item.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_qr.png`;
    downloadDataUrl(dataUrl, fileName);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl backdrop-blur-sm shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-indigo-400" /> My QR Projects & Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {user
              ? `Synced with Firebase Cloud Firestore for ${user.email}`
              : 'Sign in with Google to sync your projects permanently to Firestore'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!user && (
            <button
              onClick={onSignIn}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition cursor-pointer"
            >
              Sign In to Cloud
            </button>
          )}
          <button
            onClick={onCreateNew}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition cursor-pointer"
          >
            + Create New QR
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects by title or URL..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800 self-stretch sm:self-auto justify-center">
          {(['all', 'video', 'file'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                filterType === type
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Projects */}
      {filteredItems.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
            <QrCode className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-white text-base mb-1">No QR Projects Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mb-6">
            {searchQuery
              ? 'No projects matched your search query. Try clearing your search.'
              : 'You haven’t created or saved any video QR codes yet. Start by creating one!'}
          </p>
          <button
            onClick={onCreateNew}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition cursor-pointer shadow-lg shadow-indigo-600/20"
          >
            Create Your First Video QR
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 backdrop-blur-sm shadow-xl flex flex-col justify-between transition group hover:shadow-2xl hover:shadow-indigo-500/5"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                      {item.type === 'video' ? <Video className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-white line-clamp-1 group-hover:text-indigo-400 transition">
                        {item.title}
                      </h4>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Views count pill */}
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-[11px] font-semibold text-slate-300">
                    <Eye className="w-3 h-3 text-indigo-400" />
                    {item.viewsCount} {item.viewsCount === 1 ? 'scan' : 'scans'}
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                  {item.description || item.url}
                </p>

                {/* Target Link preview */}
                <div className="p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl mb-4 font-mono text-[11px] text-slate-400 truncate">
                  {item.url}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => onOpenPlayer(item)}
                  className="flex-1 py-2 px-3 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-indigo-600/20"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Watch Pure
                </button>

                <button
                  onClick={() => handleDownloadQr(item)}
                  title="Download High-Res QR Code"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleCopy(item.id)}
                  title="Copy Pure Viewer Link"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                >
                  {copiedId === item.id ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  title="Delete from Firestore"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
