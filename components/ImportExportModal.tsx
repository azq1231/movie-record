import React, { useState } from 'react';
import { X, Download, Upload, FileText, AlertCircle, Check } from 'lucide-react';
import { Show, ShowStatus } from '../types';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  shows: Show[];
  onImport: (shows: Omit<Show, 'id' | 'lastUpdated'>[]) => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({ isOpen, onClose, shows, onImport }) => {
  const [activeTab, setActiveTab] = useState<'text' | 'json'>('text');
  const [textInput, setTextInput] = useState('');
  const [previewCount, setPreviewCount] = useState(0);
  const [importStatus, setImportStatus] = useState<'idle' | 'success'>('idle');

  // Logic to parse the unstructured text list provided by the user
  const parseTextList = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const parsedShows: Omit<Show, 'id' | 'lastUpdated'>[] = [];

    lines.forEach(line => {
      let cleanLine = line.trim();
      let title = cleanLine;
      let currentEpisode = 1;
      let currentSeason = 1;

      // Strategy 1: Look for explicit "XX集" pattern (e.g., 萬界仙蹤419集)
      // Matches numbers right before "集"
      const jiMatch = cleanLine.match(/(\d+)\s*集/);
      
      // Strategy 2: Look for numbers at the very end of the string (e.g., 完美世界220)
      const endNumberMatch = cleanLine.match(/(\d+)$/);

      // Strategy 3: Look for Season "第X季" or "SX"
      const seasonMatch = cleanLine.match(/第(\d+)季|S(\d+)/i);

      if (seasonMatch) {
        currentSeason = parseInt(seasonMatch[1] || seasonMatch[2]);
        // We keep the season in the title usually for clarity, but strictly separating is also fine.
        // For this app, let's leave the title as is to preserve context (like "第七季") 
        // but set the season counter correctly.
      }

      if (jiMatch) {
        currentEpisode = parseInt(jiMatch[1]);
        // Remove the episode part from title to clean it up, 
        // but keep it if it's in the middle to avoid breaking the string too much.
        // Let's try to strip the "419集" from the end if it exists there.
        title = cleanLine.replace(jiMatch[0], '').trim();
      } else if (endNumberMatch) {
        // Only use end number if it's reasonable (e.g. not a year like 2023 unless it's huge)
        currentEpisode = parseInt(endNumberMatch[1]);
        title = cleanLine.replace(endNumberMatch[0], '').trim();
      }

      // Cleanup title: remove trailing punctuation or weird characters
      title = title.replace(/[-,./]+$/, '').trim();
      
      // Edge case: timestamps (e.g., 3-2153分). 
      // If parsing failed or resulted in weird huge numbers for titles that look like logs,
      // we stick to the best guess.

      if (title) {
        parsedShows.push({
          title: title,
          currentSeason: currentSeason,
          currentEpisode: currentEpisode,
          status: ShowStatus.WATCHING
        });
      }
    });

    return parsedShows;
  };

  const handleTextImport = () => {
    const parsed = parseTextList(textInput);
    if (parsed.length > 0) {
      onImport(parsed);
      setImportStatus('success');
      setTimeout(() => {
        setImportStatus('idle');
        onClose();
        setTextInput('');
      }, 1500);
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(shows, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "series_sync_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          if (event.target?.result) {
            const parsed = JSON.parse(event.target.result as string);
            if (Array.isArray(parsed)) {
               // Sanitize to ensure it matches Show type roughly (omitting IDs to be regenerated)
               const cleanImport = parsed.map((s: any) => ({
                 title: s.title || 'Unknown',
                 currentSeason: s.currentSeason || 1,
                 currentEpisode: s.currentEpisode || 1,
                 status: s.status || ShowStatus.WATCHING
               }));
               onImport(cleanImport);
               setImportStatus('success');
               setTimeout(() => {
                setImportStatus('idle');
                onClose();
               }, 1500);
            }
          }
        } catch (error) {
          alert("檔案格式錯誤，無法匯入");
        }
      };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-fade-in-up">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Upload size={20} className="text-indigo-400" />
            匯入 / 匯出
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          <button 
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'text' ? 'bg-slate-700/50 text-white border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200'}`}
          >
            文字批次貼上
          </button>
          <button 
            onClick={() => setActiveTab('json')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'json' ? 'bg-slate-700/50 text-white border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200'}`}
          >
            備份檔案 (JSON)
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {activeTab === 'text' ? (
            <div className="space-y-4 h-full flex flex-col">
              <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-lg p-3 flex gap-3 items-start">
                <AlertCircle size={18} className="text-indigo-400 mt-0.5 shrink-0" />
                <div className="text-sm text-slate-300">
                  <p className="font-bold text-indigo-300 mb-1">使用說明：</p>
                  <p>請將您的片單直接貼在下方，系統會自動辨識劇名與集數。</p>
                  <p className="text-slate-400 text-xs mt-1">支援格式： "萬界仙蹤419集" 或 "完美世界 220" 等混雜文字。</p>
                </div>
              </div>
              
              <textarea 
                value={textInput}
                onChange={(e) => {
                  setTextInput(e.target.value);
                  setPreviewCount(e.target.value.split('\n').filter(l => l.trim()).length);
                }}
                placeholder={`範例：\n萬界仙蹤419集\n妖神記第七季380集\n完美世界220`}
                className="w-full flex-1 min-h-[200px] bg-slate-900 border border-slate-600 rounded-lg p-4 text-slate-200 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
              
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm text-slate-500">預計匯入 {previewCount} 部劇集</span>
                <button 
                  onClick={handleTextImport}
                  disabled={!textInput.trim()}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all ${importStatus === 'success' ? 'bg-green-500 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50'}`}
                >
                  {importStatus === 'success' ? <Check size={18} /> : <FileText size={18} />}
                  {importStatus === 'success' ? '匯入成功' : '開始匯入'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8 py-4">
              {/* Export Section */}
              <div className="space-y-3">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Download size={18} className="text-indigo-400" />
                  匯出備份
                </h3>
                <p className="text-sm text-slate-400">
                  將目前的進度表下載成 JSON 檔案，以防資料遺失，或轉移到其他裝置。
                </p>
                <button 
                  onClick={handleExportJSON}
                  className="w-full border border-slate-600 hover:border-indigo-500 hover:bg-slate-700 text-slate-200 px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  下載 .json 備份檔
                </button>
              </div>

              <div className="h-px bg-slate-700"></div>

              {/* Import Section */}
              <div className="space-y-3">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Upload size={18} className="text-indigo-400" />
                  匯入備份
                </h3>
                <p className="text-sm text-slate-400">
                  選擇之前匯出的 .json 檔案來還原進度。
                </p>
                <label className="cursor-pointer w-full border-2 border-dashed border-slate-600 hover:border-indigo-500 hover:bg-slate-800/50 text-slate-400 hover:text-indigo-400 px-4 py-8 rounded-lg transition-all flex flex-col items-center justify-center gap-2">
                  <Upload size={24} />
                  <span className="text-sm font-medium">點擊選擇檔案</span>
                  <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};