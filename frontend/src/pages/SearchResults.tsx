import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';

interface SearchResultsProps {
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

const SearchResults: React.FC<SearchResultsProps> = ({ setCurrentSong }) => {
  const location = useLocation();
  const [results, setResults] = useState<SongResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = new URLSearchParams(location.search).get('q');

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
        setResults([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`http://localhost:5000/api/search?query=${encodeURIComponent(query)}`);
        setResults(response.data);
      } catch (err) {
        setError('Failed to fetch search results.');
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  const handlePlaySong = async (song: SongResult) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://localhost:5000/api/stream/${song.videoId}`);
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
      setError('Failed to get stream URL.');
      console.error('Stream error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-xl font-bold mb-4">Searching for "{query}"...</h2>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <h2 className="text-xl font-bold mb-4">Error: {error}</h2>
        <p>Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Search Results for "{query}"</h2>
      {results.length === 0 ? (
        <p className="text-gray-400">No results found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((song) => (
            <div key={song.videoId} className="bg-gray-800 p-4 rounded-lg shadow-md flex items-center space-x-4">
              {song.thumbnailUrl && (
                <img src={song.thumbnailUrl} alt="Thumbnail" className="w-24 h-24 rounded-md object-cover" />
              )}
              <div className="flex-grow">
                <p className="text-lg font-semibold text-white">{song.title}</p>
                <p className="text-gray-400 text-sm">{song.author}</p>
                {song.lengthText && <p className="text-gray-500 text-xs">{song.lengthText}</p>}
                <button
                  onClick={() => handlePlaySong(song)}
                  className="mt-2 px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 text-sm"
                >
                  Play
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
