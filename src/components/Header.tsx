import { useState, useEffect } from 'react';
import { Volume2, VolumeX, Maximize2, Minimize2, Users, Dices, UserCheck, Sparkles } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface HeaderProps {
  activeTab: 'roster' | 'draw' | 'groups';
  setActiveTab: (tab: 'roster' | 'draw' | 'groups') => void;
  studentCount: number;
}

export function Header({ activeTab, setActiveTab, studentCount }: HeaderProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleSound = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    soundEngine.setMuted(nextState);
    if (!nextState) {
      soundEngine.playTick(700);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 gap-3">
          
          {/* Logo & Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
                  班級抽籤與分組工具
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    課堂教學版
                  </span>
                </h1>
                <p className="text-xs text-stone-500">
                  名單上傳・動畫音效抽籤・視覺化隨機分組
                </p>
              </div>
            </div>

            {/* Mobile Sound & Fullscreen controls */}
            <div className="flex items-center gap-1 sm:hidden">
              <button
                type="button"
                id="btn-sound-toggle-mobile"
                onClick={toggleSound}
                className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
                  isMuted ? 'bg-stone-100 text-stone-400 border-stone-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}
                title={isMuted ? '開啟音效' : '靜音'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                id="btn-fullscreen-toggle-mobile"
                onClick={toggleFullscreen}
                className="p-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
                title={isFullscreen ? '退出全螢幕' : '全螢幕投影'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Center Tabs Navigation */}
          <nav className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-sm">
            <button
              type="button"
              id="tab-btn-roster"
              onClick={() => setActiveTab('roster')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'roster'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>名單管理</span>
              <span className={`text-xs px-1.5 py-0.2 rounded-full font-mono ${
                studentCount > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-stone-200 text-stone-600'
              }`}>
                {studentCount}
              </span>
            </button>

            <button
              type="button"
              id="tab-btn-draw"
              onClick={() => setActiveTab('draw')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'draw'
                  ? 'bg-white text-indigo-600 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Dices className="w-4 h-4" />
              <span>隨機抽籤</span>
            </button>

            <button
              type="button"
              id="tab-btn-groups"
              onClick={() => setActiveTab('groups')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'groups'
                  ? 'bg-white text-emerald-600 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>自動分組</span>
            </button>
          </nav>

          {/* Desktop Right Controls */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              id="btn-sound-toggle-desktop"
              onClick={toggleSound}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                isMuted
                  ? 'bg-stone-100 text-stone-400 border-stone-200 hover:bg-stone-200'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isMuted ? '音效已靜音' : '音效已開啟'}</span>
            </button>

            <button
              type="button"
              id="btn-fullscreen-toggle-desktop"
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-medium transition-colors cursor-pointer"
              title="適合在課堂投影機或電子白板展示"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span>{isFullscreen ? '退出全螢幕' : '全螢幕模式'}</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
