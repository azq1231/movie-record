import React, { useState, useRef, useEffect } from 'react';
import { X, PlusCircle } from 'lucide-react';
import { Show, ShowStatus } from '../types';

interface AddShowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (show: Omit<Show, 'id' | 'lastUpdated'>) => void;
}

export const AddShowModal: React.FC<AddShowModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newShow: Omit<Show, 'id' | 'lastUpdated'> = {
      title: title.trim(),
      currentSeason: season,
      currentEpisode: episode,
      status: ShowStatus.WATCHING,
    };

    onAdd(newShow);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle('');
    setSeason(1);
    setEpisode(1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <PlusCircle size={20} className="text-indigo-400" />
            新增追劇進度
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">劇集名稱</label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：黑暗榮耀"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">當前季數 (Season)</label>
              <input
                type="number"
                min="1"
                value={season}
                onChange={(e) => setSeason(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">當前集數 (Episode)</label>
              <input
                type="number"
                min="0"
                value={episode}
                onChange={(e) => setEpisode(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!title.trim()}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              加入片單
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
