import { useRef, useState, useEffect } from 'react'

interface MusicPlayerProps {
  currentSong: { audioUrl: string; metadata: Record<string, string | undefined> } | null
}

export default function MusicPlayer({ currentSong }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)

  useEffect(() => {
    if (audioRef.current && currentSong) {
      audioRef.current.src = currentSong.audioUrl
      audioRef.current.play()
      setIsPlaying(true)
    }
  }, [currentSong])

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause()
      else audioRef.current.play()
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime)
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value)
    setCurrentTime(seekTime)
    if (audioRef.current) audioRef.current.currentTime = seekTime
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    setVolume(v)
    if (audioRef.current) audioRef.current.volume = v
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const m = Math.floor(time / 60)
    const s = Math.floor(time % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (!currentSong) {
    return (
      <div className="bg-[#181818] border-t border-[#282828] p-4 flex items-center justify-center h-24">
        <p className="text-[#535353]">No song playing</p>
      </div>
    )
  }

  const { metadata } = currentSong

  return (
    <div className="bg-[#181818] border-t border-[#282828] px-4 py-2">
      <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onEnded={() => setIsPlaying(false)} />
      <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
        <div className="flex items-center w-72">
          {metadata.thumbnailUrl && (
            <img src={metadata.thumbnailUrl} alt="" className="w-14 h-14 rounded object-cover mr-3" />
          )}
          <div className="truncate">
            <p className="text-sm font-semibold text-white truncate">{metadata.title || 'Unknown'}</p>
            <p className="text-xs text-[#b3b3b3] truncate">{metadata.author || 'Unknown'}</p>
          </div>
        </div>

        <div className="flex flex-col items-center flex-1 max-w-xl mx-4">
          <div className="flex items-center gap-4 mb-1">
            <button onClick={togglePlay} className="bg-white text-black p-2 rounded-full hover:scale-105 transition-transform">
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
          </div>
          <div className="flex items-center w-full gap-2">
            <span className="text-xs text-[#b3b3b3] w-8 text-right">{formatTime(currentTime)}</span>
            <input type="range" min="0" max={duration || 0} value={currentTime} onChange={handleSeek} className="w-full h-1 bg-[#535353] rounded-full appearance-none cursor-pointer accent-[#1db954]" />
            <span className="text-xs text-[#b3b3b3] w-8">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center w-48 justify-end gap-2">
          <svg className="w-4 h-4 text-[#b3b3b3]" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
          <input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange} className="w-24 h-1 bg-[#535353] rounded-full appearance-none cursor-pointer accent-[#1db954]" />
        </div>
      </div>
    </div>
  )
}
