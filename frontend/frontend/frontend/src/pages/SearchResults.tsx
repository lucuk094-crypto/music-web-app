import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import LoadingSpinner from '../components/LoadingSpinner'

interface SongResult {
  videoId: string
  title: string
  author: string
  lengthText?: string
  thumbnailUrl?: string
}

interface SearchResultsProps {
  setCurrentSong: (song: { audioUrl: string; metadata: Record<string, string | undefined> } | null) => void
  apiUrl: string
}

export default function SearchResults({ setCurrentSong, apiUrl }: SearchResultsProps) {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [results, setResults] = useState<SongResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query) return
    const fetchResults = async () => {
      setLoading(true)
      try {
        const res = await axios.get(`${apiUrl}/api/search?q=${encodeURIComponent(query)}`)
        setResults(res.data)
      } catch { /* ignore */ } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [query, apiUrl])

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

  if (!query) return <p className="text-[#b3b3b3] mt-8 text-center">Search for your favorite songs, artists, or albums.</p>
  if (loading) return <LoadingSpinner />

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Results for &ldquo;{query}&rdquo;</h2>
      <div className="space-y-2">
        {results.map((s) => (
          <div key={s.videoId} onClick={() => playSong(s)} className="flex items-center gap-4 p-3 rounded-md hover:bg-[#282828] transition cursor-pointer group">
            <img src={s.thumbnailUrl || '/placeholder.svg'} alt={s.title} className="w-12 h-12 rounded object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{s.title}</p>
              <p className="text-xs text-[#b3b3b3] truncate">{s.author}</p>
            </div>
            {s.lengthText && <span className="text-xs text-[#b3b3b3] shrink-0">{s.lengthText}</span>}
            <button className="px-3 py-1.5 bg-[#1db954] text-black text-sm font-semibold rounded-full opacity-0 group-hover:opacity-100 transition">Play</button>
          </div>
        ))}
        {results.length === 0 && <p className="text-[#b3b3b3] text-center">No results found.</p>}
      </div>
    </div>
  )
}
