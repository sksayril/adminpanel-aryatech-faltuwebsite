import { useState, useRef, useEffect } from 'react';
import {
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/solid';

interface VideoQuality {
  Quality: string;
  Url: string;
  FileSize?: number;
  IsOriginal?: boolean;
  _id?: string;
}

interface CustomVideoPlayerProps {
  videos: VideoQuality[];
  title?: string;
  poster?: string;
  subtitles?: Array<{
    Language: string;
    LanguageCode: string;
    Url: string;
  }>;
}

export const CustomVideoPlayer = ({ videos, title, poster, subtitles }: CustomVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<VideoQuality | null>(null);
  const [connectionSpeed, setConnectionSpeed] = useState<number>(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sort videos by quality (highest first)
  const sortedVideos = [...videos].sort((a, b) => {
    const qualityOrder: { [key: string]: number } = { '1080p': 3, '720p': 2, '480p': 1, '360p': 0 };
    return (qualityOrder[b.Quality] || 0) - (qualityOrder[a.Quality] || 0);
  });

  // Auto-select quality based on connection speed
  useEffect(() => {
    const measureConnectionSpeed = async () => {
      try {
        const startTime = Date.now();
        const response = await fetch(sortedVideos[sortedVideos.length - 1].Url, { method: 'HEAD' });
        const endTime = Date.now();
        const contentLength = response.headers.get('content-length');
        
        if (contentLength) {
          const fileSize = parseInt(contentLength);
          const timeTaken = (endTime - startTime) / 1000; // in seconds
          const speed = fileSize / timeTaken; // bytes per second
          setConnectionSpeed(speed);
          
          // Auto-select quality based on speed
          let autoQuality: VideoQuality;
          if (speed > 2000000) { // > 2 MB/s
            autoQuality = sortedVideos[0]; // Highest quality
          } else if (speed > 1000000) { // > 1 MB/s
            autoQuality = sortedVideos.find(v => v.Quality === '720p') || sortedVideos[0];
          } else if (speed > 500000) { // > 500 KB/s
            autoQuality = sortedVideos.find(v => v.Quality === '480p') || sortedVideos[sortedVideos.length - 1];
          } else {
            autoQuality = sortedVideos[sortedVideos.length - 1]; // Lowest quality
          }
          setSelectedQuality(autoQuality);
        } else {
          // Fallback: select highest quality
          setSelectedQuality(sortedVideos[0]);
        }
      } catch (error) {
        console.error('Error measuring connection speed:', error);
        // Fallback: select highest quality
        setSelectedQuality(sortedVideos[0]);
      }
    };

    if (sortedVideos.length > 0 && !selectedQuality) {
      measureConnectionSpeed();
    }
  }, [sortedVideos]);

  // Set selected quality as video source
  useEffect(() => {
    if (selectedQuality && videoRef.current) {
      const video = videoRef.current;
      const wasPlaying = !video.paused;
      const currentTime = video.currentTime;
      
      video.src = selectedQuality.Url;
      video.load();
      
      if (wasPlaying) {
        video.play().catch(console.error);
      }
      video.currentTime = currentTime;
    }
  }, [selectedQuality]);

  // Update current time
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handleBuffering = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('waiting', handleBuffering);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('playing', handleCanPlay);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('waiting', handleBuffering);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('playing', handleCanPlay);
    };
  }, [selectedQuality]);

  // Handle controls visibility
  useEffect(() => {
    if (showControls) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isPlaying]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;

    if (!isFullscreen) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const getSpeedLabel = (speed: number): string => {
    if (speed > 2000000) return 'Excellent';
    if (speed > 1000000) return 'Good';
    if (speed > 500000) return 'Fair';
    return 'Slow';
  };

  if (!selectedQuality) {
    return (
      <div className="w-full max-w-3xl mx-auto aspect-video bg-black rounded-lg flex items-center justify-center">
        <div className="text-white text-sm">Loading video player...</div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full max-w-3xl mx-auto bg-black rounded-lg overflow-hidden group"
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={poster}
        onClick={togglePlay}
      >
        {selectedQuality && <source src={selectedQuality.Url} type="video/mp4" />}
        {subtitles?.map((subtitle, index) => (
          <track
            key={index}
            kind="subtitles"
            srcLang={subtitle.LanguageCode}
            label={subtitle.Language}
            src={subtitle.Url}
          />
        ))}
        Your browser does not support the video tag.
      </video>

      {/* Buffering indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top controls */}
        <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between">
          <div className="text-white font-semibold text-sm truncate max-w-xs">{title}</div>
          <div className="flex items-center gap-2">
            {/* Connection speed indicator */}
            {connectionSpeed > 0 && (
              <div className="text-xs text-white/80 bg-black/50 px-2 py-1 rounded hidden sm:block">
                {getSpeedLabel(connectionSpeed)}
              </div>
            )}
            {/* Quality selector */}
            <div className="relative">
              <button
                onClick={() => setShowQualityMenu(!showQualityMenu)}
                className="flex items-center gap-1 text-white bg-black/50 hover:bg-black/70 px-2 py-1 rounded transition-colors text-sm"
              >
                <Cog6ToothIcon className="h-4 w-4" />
                <span className="text-xs">{selectedQuality.Quality}</span>
              </button>
              {showQualityMenu && (
                <div className="absolute top-full right-0 mt-2 bg-black/90 rounded-lg shadow-lg overflow-hidden z-10 min-w-[150px]">
                  {sortedVideos.map((video) => (
                    <button
                      key={video._id || video.Quality}
                      onClick={() => {
                        setSelectedQuality(video);
                        setShowQualityMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors ${
                        selectedQuality.Quality === video.Quality ? 'bg-white/20' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{video.Quality}</span>
                        {video.FileSize && (
                          <span className="text-xs text-white/60">{formatFileSize(video.FileSize)}</span>
                        )}
                      </div>
                      {video.IsOriginal && (
                        <div className="text-xs text-blue-400 mt-0.5">Original</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center play button */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={togglePlay}
              className="bg-white/20 hover:bg-white/30 rounded-full p-3 transition-all hover:scale-110"
            >
              <PlayIcon className="h-12 w-12 text-white" />
            </button>
          </div>
        )}

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="text-white text-xs whitespace-nowrap hidden sm:block">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={togglePlay}
                className="text-white hover:text-white/80 transition-colors p-1.5"
              >
                {isPlaying ? (
                  <PauseIcon className="h-5 w-5" />
                ) : (
                  <PlayIcon className="h-5 w-5" />
                )}
              </button>

              <button
                onClick={toggleMute}
                className="text-white hover:text-white/80 transition-colors p-1.5"
              >
                {isMuted ? (
                  <SpeakerXMarkIcon className="h-5 w-5" />
                ) : (
                  <SpeakerWaveIcon className="h-5 w-5" />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 sm:w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider hidden sm:block"
              />

              <div className="text-white text-xs hidden sm:block">
                {Math.round((isMuted ? 0 : volume) * 100)}%
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {/* Playback speed */}
              <select
                value={playbackRate}
                onChange={(e) => {
                  const rate = parseFloat(e.target.value);
                  if (videoRef.current) {
                    videoRef.current.playbackRate = rate;
                    setPlaybackRate(rate);
                  }
                }}
                className="bg-black/50 text-white text-xs sm:text-sm px-1.5 sm:px-2 py-1 rounded border border-white/20 hidden sm:block"
              >
                <option value="0.5">0.5x</option>
                <option value="0.75">0.75x</option>
                <option value="1">1x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>

              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-white/80 transition-colors p-1.5"
              >
                {isFullscreen ? (
                  <ArrowsPointingInIcon className="h-5 w-5" />
                ) : (
                  <ArrowsPointingOutIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close quality menu */}
      {showQualityMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowQualityMenu(false)}
        />
      )}
    </div>
  );
};

