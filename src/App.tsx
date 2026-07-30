/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import VideoPlayer from './components/VideoPlayer';
import { Upload, PlaySquare, Info } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setVideoName(file.name);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setVideoName(file.name);
    }
  };

  const clearVideo = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    setVideoName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto px-8 py-6 md:py-12 flex flex-col min-h-screen">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-8 md:mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <PlaySquare className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">DarkPlay</h1>
              <p className="text-xs text-zinc-400">Pro Video Engine</p>
            </div>
          </div>
          
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-full font-medium text-sm hover:bg-blue-500 cursor-pointer transition-colors">
            <Upload className="w-4 h-4 text-white" />
            <span>Import from Gallery</span>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="video/*" 
              onChange={handleFileUpload} 
              className="hidden" 
            />
          </label>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col items-center justify-center w-full">
          {!videoUrl ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-2xl"
            >
              <div 
                className="w-full aspect-video border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-8 text-center bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Upload className="w-8 h-8 text-blue-500" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Drop your video here</h2>
                <p className="text-zinc-400 max-w-sm mb-8">
                  Support for MP4, WebM, and most local formats. Play with speed control, cast, and add subtitles.
                </p>
                <button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-medium transition-colors shadow-lg shadow-blue-500/25">
                  Browse Files
                </button>
              </div>

              <div className="mt-8 flex gap-4 text-sm text-zinc-500 justify-center">
                <div className="flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800">
                  <Info className="w-4 h-4" />
                  <span>Works entirely offline</span>
                </div>
                <div className="flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800">
                  <Info className="w-4 h-4" />
                  <span>PWA Installable</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-5xl"
            >
              <VideoPlayer 
                src={videoUrl} 
                fileName={videoName} 
                onClose={clearVideo}
              />
            </motion.div>
          )}
        </main>

        <footer className="mt-8 pt-6 border-t border-zinc-900 text-center text-xs text-zinc-600">
          DarkPlay Video Engine &copy; {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
