import { useEffect, useState } from 'react';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';

// Since backend API is on same domain via Vercel rewrites, use relative path
const API_URL = '';

interface HomeProps {
  setCurrentSong: (song: { audioUrl: string; metadata: any } | null) => void;
}

interface SongResult {
  videoId: string;
  title: string;
  author: string;
  lengthSeconds?: string;
  lengthText?: string;
  thumbnailUrl?: string;
  type: 'video' | 'music_song';
}

const Home: React.FC<HomeProps> = ({ setCurrentSong }) => {
  const [songs, setSongs] = useState<SongResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_URL}/api/search?query=trending music 2026`);
        setSongs(response.data.slice(0, 12));
      } catch (err) {
        setError('Failed to load trending music.');
        console.error('Trending error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  const handlePlaySong = async (song: SongResult) => {
    try {
      const response = await axios.get(`${API_URL}/api/stream/${song.videoId}`);
      setCurrentSong({
        audioUrl: response.data.audioUrl,
        metadata: {
          videoId: song.videoId,
          title: song.title,
          author: song.author,
          lengthSeconds: song.lengthSeconds,
          thumbnailUrl: song.thumbnailUrl,
        }
      });
    } catch (err) {
      console.error('Stream error:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-6 text-white">Trending Music</h2>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        <h2 className="text-2xl font-bold mb-4">{error}</h2>
        <p className="text-gray-400">Please make sure the backend server is running.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
        <p className="text-gray-400">Browse trending music, search your favorites, and enjoy!</p>
      </div>

      <section className="mb-8">
        <h3 className="text-xl font-semibold text-white mb-4">Trending Now</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {songs.map((song) => (
            <div
              key={song.videoId}
              className="bg-gray-800 p-3 rounded-lg hover:bg-gray-700 transition-colors duration-200 cursor-pointer group"
              onClick={() => handlePlaySong(song)}
            >
              <div className="relative mb-3">
                {song.thumbnailUrl && (
                  <img
                    src={song.thumbnailUrl}
                    alt={song.title}
                    className="w-full aspect-square object-cover rounded-md shadow-lg"
                  />
                )}
                <div className="absolute bottom-2 right-2 bg-green-500 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
                  <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-semibold text-white truncate">{song.title}</p>
              <p className="text-xs text-gray-400 truncate">{song.author}</p>
            </div>
          ))}
        </div>
      </section>

      {songs.length === 0 && !loading && (
        <p className="text-gray-400 text-center">No trending songs available. Try searching!</p>
      )}
    </div>
  );
};

export default Home;
