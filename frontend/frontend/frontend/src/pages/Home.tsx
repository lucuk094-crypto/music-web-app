import { useEffect, useState } from 'react'
import axios from 'axios'
import LoadingSpinner from '../components/LoadingSpinner'

interface SongResult {
  videoId: string
  title: string
  author: string
  lengthSeconds?: string
  thumbnailUrl?: string
}

interface HomeProps {
  setCurrentSong: (song: { audioUrl: string; metadata: Record<string, string | undefined> } | null) => void
  apiUrl: string
}

export default function Home({ setCurrentSong, apiUrl }: HomeProps) {
  const [songs, setSongs] = useState<SongResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await axios.get(`${apiUrl}/api/search?q=trending music 2026`)
        setSongs(res.data.slice(0, 12))
      } catch { /* ignore */ } finally {
        setLoading(false)
      }
    }
    fetchTrending()
  }, [apiUrl])

  const playSong = async (song: SongResult) => {
    try {
      const res = await axios.get(`${apiUrl}/api/stream/${song.videoId}`)
      setCurrentSong({
        audioUrl: res.data.audioUrl,
        metadata: {
          videoId: song.videoId,
          title: song.title,
          author: song.author,
          thumbnailUrl: song.thumbnailUrl,
        }
      })
    } catch { /* ignore */ }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-1">Good evening</h2>
      <p className="text-[#b3b3b3] mb-6">Trending music for you</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {songs.map((s) => (
          <div key={s.videoId} onClick={() => playSong(s)} className="group bg-[#181818] p-3 rounded-md hover:bg-[#282828] transition cursor-pointer">
            <div className="relative mb-3">
              <img src={s.thumbnailUrl || '/placeholder.svg'} alt={s.title} className="w-full aspect-square object-cover rounded shadow-lg" />
              <div className="absolute bottom-2 right-2 bg-[#1db954] p-2.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200">
                <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </div>
            <p className="text-sm font-semibold text-white truncate">{s.title}</p>
            <p className="text-xs text-[#b3b3b3] truncate">{s.author}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
