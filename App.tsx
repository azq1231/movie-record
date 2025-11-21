import { useState, useEffect } from 'react';
import { Show, ShowStatus, UserProfile } from './types';
import { ShowCard } from './components/ShowCard';
import { AddShowModal } from './components/AddShowModal';
import { ProfileSelector } from './components/ProfileSelector';
import { ImportExportModal } from './components/ImportExportModal';
import { PlusCircle, Search, Tv, List, LogOut, Settings } from 'lucide-react';

const PROFILES_KEY = 'series-sync-profiles';
const OLD_DATA_KEY = 'series-sync-data-v1'; // Legacy key for migration

function App() {
  // Profile State
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  
  // App State (Loaded based on active profile)
  const [shows, setShows] = useState<Show[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [filter, setFilter] = useState<string>('all'); 
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Load Profiles on Mount
  useEffect(() => {
    const storedProfiles = localStorage.getItem(PROFILES_KEY);
    if (storedProfiles) {
      try {
        const parsed = JSON.parse(storedProfiles);
        setProfiles(parsed);
      } catch (e) {
        console.error("Failed to load profiles", e);
        setProfiles([]);
      }
    } else {
      // Migration Logic: If no profiles exist but old data exists, create a Default profile
      const oldData = localStorage.getItem(OLD_DATA_KEY);
      if (oldData) {
        const defaultProfile: UserProfile = {
          id: crypto.randomUUID(),
          name: '預設使用者',
          color: 'bg-indigo-500',
          createdAt: Date.now()
        };
        const initialProfiles = [defaultProfile];
        setProfiles(initialProfiles);
        localStorage.setItem(PROFILES_KEY, JSON.stringify(initialProfiles));
        
        // Migrate data
        localStorage.setItem(`series-sync-data-${defaultProfile.id}`, oldData);
        // Optional: localStorage.removeItem(OLD_DATA_KEY); 
      }
    }
  }, []);

  // 2. Load Shows when Active Profile changes
  useEffect(() => {
    if (!activeProfile) {
      setShows([]);
      return;
    }

    const userKey = `series-sync-data-${activeProfile.id}`;
    const storedShows = localStorage.getItem(userKey);
    
    if (storedShows) {
      try {
        setShows(JSON.parse(storedShows));
      } catch (e) {
        setShows([]);
      }
    } else {
      setShows([]);
    }
  }, [activeProfile]);

  // 3. Save Shows when they change (Only if logged in)
  useEffect(() => {
    if (!activeProfile) return;
    
    const userKey = `series-sync-data-${activeProfile.id}`;
    if (shows.length > 0 || localStorage.getItem(userKey)) {
      localStorage.setItem(userKey, JSON.stringify(shows));
    }
  }, [shows, activeProfile]);

  // --- Profile Handlers ---

  const handleCreateProfile = (name: string) => {
    const newProfile: UserProfile = {
      id: crypto.randomUUID(),
      name,
      color: 'bg-blue-500', // Color logic is handled in UI mostly
      createdAt: Date.now()
    };
    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    localStorage.setItem(PROFILES_KEY, JSON.stringify(updatedProfiles));
    setActiveProfile(newProfile); // Auto login
  };

  const handleDeleteProfile = (id: string) => {
    if (window.confirm('確定要刪除這個使用者嗎？該使用者的所有紀錄都會消失。')) {
      const updatedProfiles = profiles.filter(p => p.id !== id);
      setProfiles(updatedProfiles);
      localStorage.setItem(PROFILES_KEY, JSON.stringify(updatedProfiles));
      localStorage.removeItem(`series-sync-data-${id}`); // Clear user data
      
      if (activeProfile?.id === id) {
        setActiveProfile(null);
      }
    }
  };

  const handleLogout = () => {
    setActiveProfile(null);
    setSearchQuery('');
    setFilter('all');
  };

  // --- Show Handlers (Existing Logic) ---

  const handleAddShow = (newShowData: Omit<Show, 'id' | 'lastUpdated'>) => {
    if (!activeProfile) return;
    const newShow: Show = {
      ...newShowData,
      id: crypto.randomUUID(),
      lastUpdated: Date.now(),
    };
    setShows(prev => [newShow, ...prev]);
  };

  const handleImportShows = (importedShows: Omit<Show, 'id' | 'lastUpdated'>[]) => {
    if (!activeProfile) return;
    
    const newShows: Show[] = importedShows.map(s => ({
      ...s,
      id: crypto.randomUUID(),
      lastUpdated: Date.now()
    }));

    // Append new shows to existing ones
    // Note: We are not checking for duplicates strictly by name here to keep it simple,
    // allowing users to have multiple entries if they really want to, or they can delete dupes.
    setShows(prev => [...newShows, ...prev]);
  };

  const handleDeleteShow = (id: string) => {
    if (window.confirm('確定要刪除這部劇的進度紀錄嗎？')) {
      setShows(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleUpdateProgress = (id: string, seasonChange: number, episodeChange: number) => {
    setShows(prev => prev.map(s => {
      if (s.id === id) {
        const nextSeason = Math.max(1, s.currentSeason + seasonChange);
        const nextEpisode = Math.max(0, s.currentEpisode + episodeChange);
        
        let finalEpisode = nextEpisode;
        if (seasonChange > 0) finalEpisode = 1;

        return {
          ...s,
          currentSeason: nextSeason,
          currentEpisode: seasonChange !== 0 ? finalEpisode : nextEpisode,
          lastUpdated: Date.now(),
        };
      }
      return s;
    }));
  };

  const handleStatusChange = (id: string) => {
    setShows(prev => prev.map(s => {
      if (s.id === id) {
        const statuses = Object.values(ShowStatus);
        const currentIndex = statuses.indexOf(s.status);
        const nextStatus = statuses[(currentIndex + 1) % statuses.length];
        return { ...s, status: nextStatus, lastUpdated: Date.now() };
      }
      return s;
    }));
  };

  // Filter and Search Logic
  const filteredShows = shows
    .filter(s => {
      if (filter === 'all') return true;
      if (filter === 'watching') return s.status === ShowStatus.WATCHING;
      if (filter === 'waiting') return s.status === ShowStatus.WAITING;
      if (filter === 'completed') return s.status === ShowStatus.COMPLETED;
      return true;
    })
    .filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));

  // --- Render ---

  // If no user is logged in, show profile selector
  if (!activeProfile) {
    return (
      <ProfileSelector 
        profiles={profiles}
        onSelectProfile={setActiveProfile}
        onCreateProfile={handleCreateProfile}
        onDeleteProfile={handleDeleteProfile}
      />
    );
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-20 font-sans selection:bg-indigo-500/30 animate-fade-in">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <List size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight hidden sm:block">
              SeriesSync <span className="text-slate-500 font-normal text-sm ml-1">家庭版</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Desktop */}
            <div className="hidden md:flex items-center bg-slate-800/50 rounded-lg px-3 py-1.5 border border-slate-700 focus-within:border-indigo-500/50 focus-within:bg-slate-800 transition-all">
              <Search size={16} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="搜尋劇集..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-white ml-2 w-48 placeholder:text-slate-500"
              />
            </div>

            {/* Profile Info / Logout */}
            <div className="flex items-center gap-3 border-l border-slate-700 pl-4">
               <div className="hidden sm:flex items-center gap-2">
                 <span className="text-sm font-medium text-slate-300">{activeProfile.name}</span>
                 <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold shadow-lg">
                    {activeProfile.name.charAt(0).toUpperCase()}
                 </div>
               </div>

               {/* Import/Export Button */}
               <button 
                onClick={() => setIsSettingsOpen(true)}
                className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors"
                title="匯入/匯出"
               >
                 <Settings size={20} />
               </button>

               <button 
                onClick={handleLogout}
                className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors"
                title="切換使用者"
               >
                 <LogOut size={20} />
               </button>
            </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all transform active:scale-95 ml-2"
            >
              <PlusCircle size={18} />
              <span className="hidden sm:inline">新增</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Mobile Header (Profile Name) */}
        <div className="md:hidden flex items-center justify-between mb-4 px-1">
           <span className="text-xl font-bold text-white">
             {activeProfile.name} <span className="text-slate-500 font-normal">的片單</span>
           </span>
        </div>

        {/* Mobile Search & Filters */}
        <div className="mb-8 space-y-4">
          <div className="md:hidden flex items-center bg-slate-800/50 rounded-lg px-4 py-3 border border-slate-700 focus-within:border-indigo-500/50 focus-within:bg-slate-800 transition-all">
            <Search size={18} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="搜尋您的片單..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-base text-white ml-3 w-full placeholder:text-slate-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
             {[
               { id: 'all', label: '全部' },
               { id: 'watching', label: '觀看中' },
               { id: 'waiting', label: '等待更新' },
               { id: 'completed', label: '已看完' }
             ].map(f => (
               <button
                 key={f.id}
                 onClick={() => setFilter(f.id)}
                 className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                   filter === f.id 
                   ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' 
                   : 'bg-slate-800 text-slate-400 hover:bg-slate-750 hover:text-slate-200'
                 }`}
               >
                 {f.label}
               </button>
             ))}
          </div>
        </div>

        {/* Empty State */}
        {shows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/50">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 animate-pulse">
               <Tv size={40} className="text-indigo-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">尚未開始追蹤</h2>
            <p className="text-slate-400 max-w-md mb-8">
              嗨 {activeProfile.name}！點擊下方按鈕，立即加入您的第一部劇集進度。
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-semibold shadow-xl shadow-indigo-500/20 transition-all"
              >
                新增劇集
              </button>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-semibold transition-all"
              >
                匯入清單
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                {filter === 'all' ? '所有劇集' : '篩選結果'} · {filteredShows.length}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredShows.map(show => (
                <ShowCard 
                  key={show.id} 
                  show={show} 
                  onUpdateProgress={handleUpdateProgress} 
                  onDelete={handleDeleteShow}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <AddShowModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={handleAddShow} 
      />

      <ImportExportModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        shows={shows}
        onImport={handleImportShows}
      />
    </div>
  );
}

export default App;