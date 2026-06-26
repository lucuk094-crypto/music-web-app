import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MusicPlayer from './components/MusicPlayer';
import SearchBar from './components/SearchBar';
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';

// Main App component
function App() {
  const [currentSong, setCurrentSong] = useState<{ audioUrl: string; metadata: any } | null>(null);

  return (
    <Router>
      <div className="flex h-screen bg-gray-900 text-gray-100">
        {/* Left Sidebar (Navigation) */}
        <aside className="w-64 bg-black p-4 flex flex-col">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Music Web</h1>
          </div>
          <nav className="flex-grow">
            <ul>
              <li className="mb-4">
                <Link to="/" className="flex items-center text-gray-400 hover:text-white transition-colors duration-200">
                  <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2.586l.293.293A1 1 0 009.707 15.293l3-3a1 1 0 000-1.414L10.707 9.707a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L8 13.414V17a1 1 0 001 1h6a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414L10.707 2.293z"></path></svg>
                  Home
                </Link>
              </li>
              <li className="mb-4">
                <Link to="/search" className="flex items-center text-gray-400 hover:text-white transition-colors duration-200">
                  <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path></svg>
                  Search
                </Link>
              </li>
              {/* Add more navigation links here (e.g., Your Library, Playlists) */}
            </ul>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-grow flex flex-col overflow-hidden">
          <header className="bg-gray-800 p-4 shadow-md flex items-center justify-between z-10">
            <SearchBar /> {/* Removed onSearch prop */}
            {/* User Profile/Auth could go here */}
          </header>

          <div className="flex-grow p-6 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Home setCurrentSong={setCurrentSong} />} />
              <Route path="/search" element={<SearchResults setCurrentSong={setCurrentSong} />} />
              {/* Add more routes here for playlists, artist details, etc. */}
            </Routes>
          </div>
        </main>
      </div>

      {/* Music Player (Fixed at Bottom) */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <MusicPlayer currentSong={currentSong} />
      </div>
    </Router>
  );
}

export default App;
