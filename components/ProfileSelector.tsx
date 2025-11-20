import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Plus, User, Trash2 } from 'lucide-react';

interface ProfileSelectorProps {
  profiles: UserProfile[];
  onSelectProfile: (profile: UserProfile) => void;
  onCreateProfile: (name: string) => void;
  onDeleteProfile: (id: string) => void;
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({ 
  profiles, 
  onSelectProfile, 
  onCreateProfile,
  onDeleteProfile
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [editingMode, setEditingMode] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProfileName.trim()) {
      onCreateProfile(newProfileName.trim());
      setNewProfileName('');
      setIsCreating(false);
    }
  };

  // Generate a consistent color from string
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-red-500', 'bg-orange-500', 'bg-amber-500', 
      'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 
      'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 
      'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 
      'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="max-w-3xl w-full text-center">
        <h1 className="text-4xl font-bold text-white mb-8 tracking-tight">誰在追劇？</h1>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 justify-center place-items-center">
          {/* Existing Profiles */}
          {profiles.map(profile => (
            <div key={profile.id} className="group relative flex flex-col items-center gap-3">
              <button 
                onClick={() => !editingMode && onSelectProfile(profile)}
                className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-2xl transition-transform ${getAvatarColor(profile.name)} ${editingMode ? 'opacity-70 cursor-default' : 'hover:scale-105 hover:ring-4 ring-indigo-500/30 cursor-pointer'}`}
              >
                {profile.name.charAt(0).toUpperCase()}
              </button>
              <span className="text-slate-300 font-medium text-lg group-hover:text-white transition-colors">
                {profile.name}
              </span>
              
              {editingMode && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteProfile(profile.id); }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}

          {/* Add Profile Button */}
          <div className="flex flex-col items-center gap-3">
            <button 
              onClick={() => setIsCreating(true)}
              className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-600 border-dashed flex items-center justify-center text-slate-500 hover:text-white hover:border-indigo-500 hover:bg-slate-800/80 transition-all group"
            >
              <Plus size={40} className="group-hover:scale-110 transition-transform" />
            </button>
            <span className="text-slate-500 font-medium text-lg">新增成員</span>
          </div>
        </div>

        {/* Manage Profiles Toggle */}
        {profiles.length > 0 && (
          <button 
            onClick={() => setEditingMode(!editingMode)}
            className="mt-12 text-slate-500 hover:text-slate-300 text-sm border border-slate-700 px-4 py-2 rounded-full hover:bg-slate-800 transition-colors"
          >
            {editingMode ? '完成編輯' : '管理使用者'}
          </button>
        )}
      </div>

      {/* Create Profile Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700 shadow-2xl animate-scale-up">
            <h2 className="text-xl font-bold text-white mb-4">建立新成員</h2>
            <form onSubmit={handleCreate}>
              <input
                autoFocus
                type="text"
                placeholder="輸入名字"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none mb-4"
              />
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-2.5 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  disabled={!newProfileName.trim()}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  建立
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};