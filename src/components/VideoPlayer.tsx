import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  Settings, Download, Cast, Subtitles, PictureInPicture, 
  Upload, FileVideo
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

// Format seconds to mm:ss or hh:mm:ss
function formatTime(seconds: number) {
  if (isNaN(seconds) || seconds === Infinity) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface VideoPlayerProps {
  src?: string;
  fileName?: string;
  onClose?: () => void;
}

export default function VideoPlayer({ src, fileName, onClose }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  // Settings menus
  const [showSettings, setShowSettings] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState('Auto');
  
  // Subtitles
  const [subtitleFile, setSubtitleFile] = useState<File | null>(null);
  const [subtitleUrl, setSubtitleUrl] = useState<string | null>(null);

  // Auto-hide controls
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hideControlsLater = useCallback(() => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  }, [isPlaying]);

  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      hideControlsLater();
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchstart', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchstart', handleMouseMove);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [hideControlsLater]);

  // Video Events
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Volume
  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = val;
      setVolume(val);
      setIsMuted(val === 0);
    }
  };

  // Fullscreen
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error("Error attempting to enable fullscreen:", err);
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Picture in Picture
  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (error) {
      console.error("PiP failed", error);
    }
  };

  // Cast (Using experimental Remote Playback API if available)
  const handleCast = () => {
    if (videoRef.current && (videoRef.current as any).remote) {
      (videoRef.current as any).remote.prompt().catch(() => {
        // Ignore prompt dismissal error
      });
    } else {
      alert("Casting is not supported in this browser.");
    }
  };

  // Subtitles
  const handleSubtitleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSubtitleFile(file);
      const url = URL.createObjectURL(file);
      setSubtitleUrl(url);
    }
  };

  // Speed
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSettings(false);
  };

  // Download
  const handleDownload = () => {
    if (!src) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = fileName || 'downloaded-video.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!src) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-zinc-950 text-zinc-400 p-6 rounded-2xl border border-zinc-800/50 shadow-xl">
        <FileVideo className="w-16 h-16 mb-4 text-zinc-600" />
        <h2 className="text-xl font-medium text-zinc-200 mb-2">No Video Selected</h2>
        <p className="text-center text-sm mb-6 max-w-sm">
          Upload a video from your gallery to start watching. We support local playback with speed control and more.
        </p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video bg-gradient-to-tr from-[#0a0a0a] via-[#111] to-[#0a0a0a] rounded-2xl overflow-hidden group shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/5"
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onMouseEnter={() => setShowControls(true)}
      onClick={() => setShowSettings(false)}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
      >
        {subtitleUrl && (
          <track kind="subtitles" src={subtitleUrl} label="Uploaded Subtitles" default />
        )}
      </video>

      {/* Center Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          >
            <div className="flex items-center gap-16 pointer-events-auto">
              <div 
                onClick={() => { if (videoRef.current) videoRef.current.currentTime -= 10; }}
                className="w-16 h-16 rounded-full flex items-center justify-center bg-white/5 backdrop-blur-md border border-white/10 text-2xl cursor-pointer hover:scale-110 transition-transform"
              >
                «
              </div>
              <div 
                onClick={togglePlay}
                className="w-24 h-24 rounded-full flex items-center justify-center bg-white text-black shadow-[0_0_40px_rgba(255,255,255,0.3)] cursor-pointer hover:scale-105 transition-transform"
              >
                {isPlaying ? (
                  <Pause className="w-10 h-10 fill-current" />
                ) : (
                  <div className="w-0 h-0 border-t-[14px] border-t-transparent border-l-[22px] border-l-black border-b-[14px] border-b-transparent ml-2"></div>
                )}
              </div>
              <div 
                onClick={() => { if (videoRef.current) videoRef.current.currentTime += 10; }}
                className="w-16 h-16 rounded-full flex items-center justify-center bg-white/5 backdrop-blur-md border border-white/10 text-2xl cursor-pointer hover:scale-110 transition-transform"
              >
                »
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls Overlay */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent transition-opacity duration-300 flex flex-col justify-between",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Top Bar */}
        <div className="absolute top-0 left-0 w-full h-20 px-8 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent text-white">
          <div className="flex items-center gap-4">
            {onClose && (
              <div onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors">
                <span className="text-2xl font-bold leading-none mb-1">‹</span>
              </div>
            )}
            <div>
              <h1 className="text-lg font-medium">{fileName || 'Playing Video'}</h1>
              <p className="text-xs text-white/40 uppercase tracking-widest">Local Media</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={handleCast} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <span className="text-xs font-semibold">TV CAST</span>
              <Cast className="w-4 h-4" />
            </button>
            <button onClick={handleDownload} className="relative flex items-center gap-2 group w-10 h-10 rounded-full border border-white/10 justify-center hover:bg-white/10 transition-colors" title="Download">
              <Download className="w-5 h-5" />
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></span>
            </button>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 w-full p-8 z-20" onClick={e => e.stopPropagation()}>
          {/* Progress Bar */}
          <div className="w-full flex flex-col gap-2 mb-6 group/slider cursor-pointer">
            <div className="flex justify-between text-xs font-mono text-white/60">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div className="relative h-1.5 w-full bg-white/10 rounded-full overflow-visible group">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:scale-0 group-hover:[&::-webkit-slider-thumb]:scale-100 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:shadow-lg bg-transparent z-10"
                style={{
                  background: `linear-gradient(to right, #3b82f6 ${(currentTime / duration) * 100}%, transparent ${(currentTime / duration) * 100}%)`
                }}
              />
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8 relative">
              {/* Playback Speed */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">Speed</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
                  className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 text-sm font-semibold transition-colors"
                >
                  {playbackSpeed}x
                </button>
              </div>
              {/* Quality */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">Quality</span>
                <button className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 text-sm font-semibold transition-colors">
                  {quality}
                </button>
              </div>
              {/* Subtitles */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">Captions</span>
                <label className="cursor-pointer px-3 py-1 rounded-md bg-blue-500/20 text-blue-400 text-sm font-semibold border border-blue-500/30 hover:bg-blue-500/30 transition-colors">
                  {subtitleFile ? 'Loaded' : 'Upload .vtt'}
                  <input type="file" accept=".vtt" onChange={handleSubtitleUpload} className="hidden" />
                </label>
              </div>
              {/* PiP */}
              <div className="flex flex-col items-center gap-1 hidden sm:flex">
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">PiP</span>
                <button onClick={togglePiP} className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 text-sm font-semibold transition-colors">
                  Enable
                </button>
              </div>

              {/* Settings Menu */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full right-0 mb-4 w-48 bg-zinc-900/95 backdrop-blur border border-zinc-800 rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1"
                  >
                    <div className="px-3 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Speed</div>
                    {[0.5, 1, 1.25, 1.5, 2].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => handleSpeedChange(speed)}
                        className={cn(
                          "text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between",
                          playbackSpeed === speed ? "bg-blue-500/20 text-blue-400 font-medium" : "text-zinc-200 hover:bg-zinc-800"
                        )}
                      >
                        {speed === 1 ? 'Normal' : `${speed}x`}
                        {playbackSpeed === speed && <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                      </button>
                    ))}
                    <div className="h-px bg-zinc-800 my-1" />
                    <div className="px-3 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Quality</div>
                    <button className="text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between bg-blue-500/20 text-blue-400 font-medium">
                      {quality}
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                <button onClick={toggleMute} className="text-white hover:text-blue-400 transition-colors">
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <div className="w-24 h-1.5 bg-white/20 rounded-full relative flex items-center">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="absolute inset-0 w-full h-full appearance-none cursor-pointer bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all z-10"
                    style={{
                      background: `linear-gradient(to right, #ffffff ${(isMuted ? 0 : volume) * 100}%, transparent ${(isMuted ? 0 : volume) * 100}%)`
                    }}
                  />
                </div>
              </div>
              <div onClick={toggleFullscreen} className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 cursor-pointer transition-colors">
                 {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
