import { useRef, useState, useEffect } from 'react';

interface MusicPlayerProps {
  currentSong: { audioUrl: string; metadata: any } | null;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ currentSong }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    if (audioRef.current && currentSong) {
      audioRef.current.src = currentSong.audioUrl;
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [currentSong]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };


  if (!currentSong) {
    return (
      <div className="bg-gray-900 border-t border-gray-700 p-4 flex items-center justify-center h-24">
        <p className="text-gray-400">No song playing</p>
      </div>
    );
  }

  const { metadata } = currentSong;

  return (
    <div className="bg-gray-900 border-t border-gray-700 px-4 py-2">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
        {/* Left: Song Info */}
        <div className="flex items-center w-72">
          {metadata.thumbnailUrl && (
            <img
              src={metadata.thumbnailUrl}
              alt="Album Art"
              className="w-14 h-14 rounded-md object-cover mr-3"
            />
          )}
          <div className="truncate">
            <p className="text-sm font-semibold text-white truncate">
              {metadata.title || 'Unknown Title'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {metadata.author || 'Unknown Artist'}
            </p>
          </div>
          <button className="ml-4 text-gray-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 16.5A2.5 2.5 0 116.5 14H2.5A2.5 2.5 0 014 16.5zM14.5 2A2.5 2.5 0 1112 4.5V2.5A2.5 2.5 0 0114.5 2zM20.5 2A2.5 2.5 0 1118 4.5V2.5A2.5 2.5 0 0120.5 2zM14.5 22A2.5 2.5 0 1112 19.5v1A2.5 2.5 0 0114.5 22z" />
            </svg>
          </button>
        </div>

        {/* Center: Controls & Progress Bar */}
        <div className="flex flex-col items-center flex-grow max-w-xl mx-4">
          <div className="flex items-center space-x-4 mb-1">
            <button className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" transform="rotate(180 12 12)" />
              </svg>
            </button>
            <button
              onClick={togglePlay}
              className="bg-white text-black p-2 rounded-full hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
          </div>
          <div className="flex items-center w-full space-x-2">
            <span className="text-xs text-gray-400 w-8 text-right">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-green-500"
            />
            <span className="text-xs text-gray-400 w-8">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Volume Control */}
        <div className="flex items-center w-48 justify-end space-x-2">
          <button className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
            </svg>
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-green-500"
          />
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
