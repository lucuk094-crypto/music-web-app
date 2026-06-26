import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import MusicPlayer from './components/MusicPlayer'
import SearchBar from './components/SearchBar'
import Home from './pages/Home'
import SearchResults from './pages/SearchResults'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function App() {
  const [currentSong, setCurrentSong] = useState<{
    audioUrl: string
    metadata: Record<string, string | undefined>
  } | null>(null)

  return (
    <Router>
      <div className="flex h-screen bg-[#121212] text-[#b3b3b3]">
        {/* Left Sidebar */}
        <aside className="w-64 bg-black p-6 flex flex-col shrink-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white tracking-tight">Music Web</h1>
          </div>
          <nav className="flex-1">
            <ul className="space-y-2">
              <li>
                <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-md text-[#b3b3b3] hover:text-white transition-colors duration-200">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.5 3.247a1 1 0 0 0-1 0L4 7.577V20h4.5v-6a1.5 1.5 0 0 1 1.5-1.5h4.5a1.5 1.5 0 0 1 1.5 1.5v6H20V7.577l-7.5-4.33z"/></svg>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/search" className="flex items-center gap-3 px-3 py-2 rounded-md text-[#b3b3b3] hover:text-white transition-colors duration-200">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10.533 1.27893C5.35215 1.27893 1.12598 5.41887 1.12598 10.5579C1.12598 15.697 5.35215 19.843 10.533 19.843C12.7672 19.843 14.8235 19.0681 16.4402 17.7793L20.7929 22.132C21.1834 22.5225 21.8166 22.5225 22.2071 22.132C22.5976 21.7414 22.5976 21.1083 22.2071 20.7178L17.8634 16.3741C19.1616 14.7849 19.94 12.7635 19.94 10.5579C19.94 5.41887 15.7138 1.27893 10.533 1.27893zM3.12598 10.5579C3.12598 6.58036 6.44136 3.27893 10.533 3.27893C14.6246 3.27893 17.94 6.58036 17.94 10.5579C17.94 14.5355 14.6246 17.843 10.533 17.843C6.44136 17.843 3.12598 14.5355 3.12598 10.5579z"/></svg>
                  Search
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-[#121212] px-6 py-4 flex items-center gap-4">
            <SearchBar />
          </header>
          <div className="flex-1 overflow-y-auto px-6 pb-24 scrollbar-thin">
            <Routes>
              <Route path="/" element={<Home setCurrentSong={setCurrentSong} apiUrl={API_URL} />} />
              <Route path="/search" element={<SearchResults setCurrentSong={setCurrentSong} apiUrl={API_URL} />} />
            </Routes>
          </div>
        </main>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <MusicPlayer currentSong={currentSong} />
      </div>
    </Router>
  )
}

export default App
