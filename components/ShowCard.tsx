import React, { useCallback } from 'react';
import { Show, ShowStatus } from '../types';
import { Plus, Minus, Trash2, Tv, CheckCircle, Clock, PlayCircle, XCircle } from 'lucide-react';

interface ShowCardProps {
  show: Show;
  onUpdateProgress: (id: string, seasonChange: number, episodeChange: number) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string) => void;
}

export const ShowCard: React.FC<ShowCardProps> = ({ show, onUpdateProgress, onDelete, onStatusChange }) => {
  
  // Calculate relative time string in Chinese
  const getLastUpdatedText = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return '剛剛';
    if (minutes < 60) return `${minutes} 分鐘前`;
    if (hours < 24) return `${hours} 小時前`;
    return `${days} 天前`;
  };

  const handleStatusClick = useCallback(() => {
    onStatusChange(show.id);
  }, [onStatusChange, show.id]);

  const getStatusColor = (status: ShowStatus) => {
    switch (status) {
      case ShowStatus.WATCHING: return 'text-green-400 border-green-400/20 bg-green-400/5';
      case ShowStatus.WAITING: return 'text-amber-400 border-amber-400/20 bg-amber-400/5';
      case ShowStatus.COMPLETED: return 'text-blue-400 border-blue-400/20 bg-blue-400/5';
      case ShowStatus.DROPPED: return 'text-red-400 border-red-400/20 bg-red-400/5';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: ShowStatus) => {
    switch (status) {
      case ShowStatus.WATCHING: return <PlayCircle size={14} className="mr-1.5" />;
      case ShowStatus.WAITING: return <Clock size={14} className="mr-1.5" />;
      case ShowStatus.COMPLETED: return <CheckCircle size={14} className="mr-1.5" />;
      case ShowStatus.DROPPED: return <XCircle size={14} className="mr-1.5" />;
      default: return <Tv size={14} className="mr-1.5" />;
    }
  };

  const getStatusLabel = (status: ShowStatus) => {
    switch (status) {
      case ShowStatus.WATCHING: return '觀看中';
      case ShowStatus.WAITING: return '等待更新';
      case ShowStatus.COMPLETED: return '已看完';
      case ShowStatus.DROPPED: return '棄劇';
      default: return status;
    }
  };

  // Generate a subtle gradient based on the title string to give some visual variety without images
  const getGradient = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `linear-gradient(135deg, hsl(${hue}, 60%, 15%) 0%, hsl(${hue}, 50%, 10%) 100%)`;
  };

  return (
    <div 
      className="group relative rounded-xl overflow-hidden border border-slate-700/50 shadow-lg hover:border-indigo-500/50 hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col"
      style={{ background: getGradient(show.title) }}
    >
      {/* Header */}
      <div className="p-5 pb-3 flex items-start justify-between gap-4">
        <h3 className="text-xl font-bold text-white leading-tight break-words drop-shadow-sm flex-1">
          {show.title}
        </h3>
        
        <button 
          onClick={() => onDelete(show.id)}
          className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
          title="刪除"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="px-5 flex-1">
        <button 
          onClick={handleStatusClick}
          className={`flex items-center px-2.5 py-1 rounded-full border text-xs font-medium transition-all w-fit mb-4 hover:brightness-125 ${getStatusColor(show.status)}`}
        >
          {getStatusIcon(show.status)}
          {getStatusLabel(show.status)}
        </button>

        {/* Big Counters */}
        <div className="flex items-center gap-4 mb-4">
          
          {/* Season */}
          <div className="flex-1 bg-black/20 rounded-lg p-3 border border-white/5 flex flex-col items-center gap-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">季 (Season)</span>
            <div className="flex items-center justify-between w-full">
              <button 
                onClick={() => onUpdateProgress(show.id, -1, 0)}
                disabled={show.currentSeason <= 1}
                className="text-slate-500 hover:text-white disabled:opacity-20 p-1 transition-colors"
              >
                <Minus size={18} />
              </button>
              <span className="text-2xl font-mono font-bold text-white">{show.currentSeason}</span>
              <button 
                onClick={() => onUpdateProgress(show.id, 1, 0)}
                className="text-indigo-400 hover:text-white p-1 transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Episode */}
          <div className="flex-[1.2] bg-black/20 rounded-lg p-3 border border-white/5 flex flex-col items-center gap-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">集 (Episode)</span>
            <div className="flex items-center justify-between w-full">
              <button 
                onClick={() => onUpdateProgress(show.id, 0, -1)}
                disabled={show.currentEpisode <= 0}
                className="text-slate-500 hover:text-white disabled:opacity-20 p-1 transition-colors"
              >
                <Minus size={18} />
              </button>
              <span className="text-3xl font-mono font-bold text-white text-shadow">{show.currentEpisode}</span>
              <button 
                onClick={() => onUpdateProgress(show.id, 0, 1)}
                className="text-indigo-400 hover:text-white p-1 transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-black/20 border-t border-white/5 flex justify-end">
         <span className="text-[10px] text-slate-500">
           上次觀看：{getLastUpdatedText(show.lastUpdated)}
         </span>
      </div>
    </div>
  );
};