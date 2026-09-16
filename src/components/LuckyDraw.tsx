import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, RotateCcw, Volume2, History, Check, AlertCircle, Play, Undo2 } from 'lucide-react';
import { Student, DrawRepetitionMode, DrawHistoryItem } from '../types';
import { soundEngine } from '../utils/audio';

interface LuckyDrawProps {
  students: Student[];
  onNavigateToRoster: () => void;
}

export function LuckyDraw({ students, onNavigateToRoster }: LuckyDrawProps) {
  const [repeatMode, setRepeatMode] = useState<DrawRepetitionMode>('disallow');
  const [remainingStudentIds, setRemainingStudentIds] = useState<string[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [currentDisplayName, setCurrentDisplayName] = useState<string>('準備抽籤');
  const [currentDisplaySeat, setCurrentDisplaySeat] = useState<string>('');
  const [winner, setWinner] = useState<Student | null>(null);
  const [history, setHistory] = useState<DrawHistoryItem[]>([]);
  const [rollSpeed, setRollSpeed] = useState<number>(50);

  const animationFrameRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize or synchronize remaining student IDs
  useEffect(() => {
    // If student list changes, filter out non-existent IDs or initialize
    setRemainingStudentIds(prev => {
      const currentValidIds = new Set(students.map(s => s.id));
      const filtered = prev.filter(id => currentValidIds.has(id));
      // If pool is empty or student count increased significantly, reset to all
      if (filtered.length === 0 && students.length > 0) {
        return students.map(s => s.id);
      }
      return filtered;
    });
  }, [students]);

  // Reset pool
  const handleResetPool = () => {
    setRemainingStudentIds(students.map(s => s.id));
    setWinner(null);
    setCurrentDisplayName('準備抽籤');
    setCurrentDisplaySeat('');
  };

  // The active candidate pool
  const candidateStudents = repeatMode === 'allow'
    ? students
    : students.filter(s => remainingStudentIds.includes(s.id));

  // Trigger celebration confetti
  const triggerConfetti = () => {
    try {
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        zIndex: 1000,
      };

      const fire = (particleRatio: number, opts: confetti.Options) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      };

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });
      fire(0.2, {
        spread: 60,
      });
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    } catch {
      // ignore
    }
  };

  // Start the suspenseful rolling lottery
  const handleStartDraw = () => {
    if (isRolling) return;
    if (students.length === 0) return;

    if (candidateStudents.length === 0) {
      if (repeatMode === 'disallow') {
        alert('全班同學已全部抽過一輪囉！即將為您重新重設抽籤池。');
        handleResetPool();
      }
      return;
    }

    setIsRolling(true);
    setWinner(null);

    // Pick a final chosen student beforehand
    const randomIndex = Math.floor(Math.random() * candidateStudents.length);
    const chosenStudent = candidateStudents[randomIndex];

    // Suspense easing animation parameters
    const totalDuration = 3200; // ms
    const startTime = Date.now();
    let currentInterval = 40;

    const rollStep = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);

      // Random name display from all students for visual variety
      const randomDisplay = students[Math.floor(Math.random() * students.length)];
      setCurrentDisplayName(randomDisplay.name);
      setCurrentDisplaySeat(randomDisplay.seatNumber || '');

      // Sound tick (pitch increases slightly as suspense builds)
      soundEngine.playTick(450 + progress * 350);

      // Interval slows down non-linearly towards the end (ease-out cubic)
      if (progress < 1) {
        currentInterval = 40 + Math.pow(progress, 2.5) * 380;
        setRollSpeed(currentInterval);
        animationFrameRef.current = setTimeout(rollStep, currentInterval);
      } else {
        // Final reveal!
        setCurrentDisplayName(chosenStudent.name);
        setCurrentDisplaySeat(chosenStudent.seatNumber || '');
        setWinner(chosenStudent);
        setIsRolling(false);

        // Play Fanfare & Shoot Confetti!
        soundEngine.playFanfare();
        triggerConfetti();

        // Update Remaining pool if repeat is disabled
        if (repeatMode === 'disallow') {
          setRemainingStudentIds(prev => prev.filter(id => id !== chosenStudent.id));
        }

        // Add to history
        setHistory(prev => [
          {
            id: `hist-${Date.now()}`,
            student: chosenStudent,
            timestamp: new Date(),
            round: prev.length + 1,
          },
          ...prev,
        ]);
      }
    };

    soundEngine.playTensionPulse();
    rollStep();
  };

  // Keyboard shortcut: Spacebar to draw
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement)?.tagName !== 'INPUT' && (e.target as HTMLElement)?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        handleStartDraw();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) clearTimeout(animationFrameRef.current);
    };
  }, []);

  // Return a student from history back to pool
  const handleReturnToPool = (studentId: string) => {
    if (!remainingStudentIds.includes(studentId)) {
      setRemainingStudentIds(prev => [...prev, studentId]);
    }
  };

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-stone-900">尚未建立學生名單</h2>
        <p className="text-sm text-stone-500 mt-1 max-w-md mx-auto">
          請先前往「名單管理」上傳 CSV 或貼上姓名，即可開始進行隨機抽籤點名。
        </p>
        <button
          type="button"
          onClick={onNavigateToRoster}
          className="mt-6 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
        >
          前往匯入名單
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Control Bar: Mode Toggle and Status */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Repeat Mode Radio / Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold text-stone-600 shrink-0">抽籤模式設定：</span>
          <div className="grid grid-cols-2 bg-stone-100 p-1 rounded-xl text-xs font-medium w-full sm:w-auto border border-stone-200">
            <button
              type="button"
              id="mode-disallow-repeat"
              onClick={() => setRepeatMode('disallow')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                repeatMode === 'disallow'
                  ? 'bg-white text-indigo-700 font-bold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Check className={`w-3.5 h-3.5 ${repeatMode === 'disallow' ? 'opacity-100' : 'opacity-0'}`} />
              <span>不重複抽取 (抽完排除)</span>
            </button>
            <button
              type="button"
              id="mode-allow-repeat"
              onClick={() => setRepeatMode('allow')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                repeatMode === 'allow'
                  ? 'bg-white text-indigo-700 font-bold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Check className={`w-3.5 h-3.5 ${repeatMode === 'allow' ? 'opacity-100' : 'opacity-0'}`} />
              <span>可重複抽取 (人人均等)</span>
            </button>
          </div>
        </div>

        {/* Pool Counter & Reset */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {repeatMode === 'disallow' ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-stone-500">待抽候選池：</span>
              <span className="font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {candidateStudents.length} / {students.length} 人
              </span>
              <button
                type="button"
                id="btn-reset-pool"
                onClick={handleResetPool}
                disabled={isRolling}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 text-xs transition-colors cursor-pointer disabled:opacity-50"
                title="重新將所有學生放回抽籤池"
              >
                <RotateCcw className="w-3 h-3" />
                <span>重設池</span>
              </button>
            </div>
          ) : (
            <span className="text-xs text-stone-500">
              全體學生共 <strong className="text-stone-800 font-mono">{students.length}</strong> 人皆在抽籤池中
            </span>
          )}
        </div>

      </div>

      {/* Main Big Stage for Classroom Projector */}
      <div className="relative overflow-hidden bg-gradient-to-b from-stone-900 via-indigo-950 to-stone-900 rounded-3xl p-8 sm:p-14 text-center shadow-xl border border-indigo-900/50">
        
        {/* Subtle decorative background lights */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top badge */}
        <div className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-indigo-200 font-medium mb-8">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>
            {isRolling
              ? '🎲 正在隨機抽取中...'
              : winner
              ? '🎉 恭喜幸運抽中！'
              : '按下方按鈕或空白鍵 [Space] 開始抽籤'}
          </span>
        </div>

        {/* Huge Name Display Card with Rolling Animation */}
        <div className="relative max-w-xl mx-auto my-4 py-8 px-6 sm:px-12 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-lg flex flex-col items-center justify-center min-h-[200px]">
          
          {currentDisplaySeat && (
            <div className="text-sm sm:text-base font-mono font-bold tracking-widest text-indigo-300 uppercase mb-2">
              座號 {currentDisplaySeat}
            </div>
          )}

          <div
            className={`transition-transform duration-100 ${
              isRolling ? 'scale-105 blur-[0.3px]' : winner ? 'scale-110' : ''
            }`}
          >
            <h1
              className={`text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight transition-colors ${
                winner
                  ? 'text-amber-300 drop-shadow-[0_0_25px_rgba(251,191,36,0.5)]'
                  : isRolling
                  ? 'text-white'
                  : 'text-stone-300'
              }`}
            >
              {currentDisplayName}
            </h1>
          </div>

          {winner && (
            <div className="mt-4 flex items-center gap-2 text-emerald-400 text-xs sm:text-sm font-semibold animate-bounce">
              <Sparkles className="w-4 h-4" />
              <span>幸運之星誕生！</span>
            </div>
          )}

        </div>

        {/* Action Button */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            id="btn-start-draw-main"
            onClick={handleStartDraw}
            disabled={isRolling || (repeatMode === 'disallow' && candidateStudents.length === 0)}
            className={`w-full sm:w-auto px-10 py-4 rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-lg cursor-pointer ${
              isRolling
                ? 'bg-stone-700 text-stone-400 cursor-not-allowed'
                : candidateStudents.length === 0 && repeatMode === 'disallow'
                ? 'bg-stone-800 text-stone-500'
                : 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-stone-950 hover:shadow-amber-500/25'
            }`}
          >
            <Play className={`w-5 h-5 fill-current ${isRolling ? 'animate-spin' : ''}`} />
            <span>
              {isRolling
                ? '抽取中...'
                : candidateStudents.length === 0 && repeatMode === 'disallow'
                ? '名單已抽完 (點上方重設)'
                : '立即抽出一名學生'}
            </span>
          </button>
        </div>

        <p className="text-[11px] text-stone-400 mt-4">
          提示：也可以直接按鍵盤「空白鍵 (Space)」快速抽籤
        </p>
      </div>

      {/* Draw History & Remaining Pool Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Recent Draw History */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-stone-500" />
              <h3 className="text-sm font-bold text-stone-900">
                抽籤紀錄 ({history.length} 次)
              </h3>
            </div>
            {history.length > 0 && (
              <button
                type="button"
                id="btn-clear-draw-history"
                onClick={() => setHistory([])}
                className="text-xs text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
              >
                清除紀錄
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="py-10 text-center text-xs text-stone-400">
              尚無抽籤紀錄，點擊上方按鈕開始抽籤！
            </div>
          ) : (
            <div className="mt-3 divide-y divide-stone-100 max-h-[280px] overflow-y-auto pr-1">
              {history.map((item, idx) => (
                <div
                  key={item.id}
                  className="py-2.5 flex items-center justify-between hover:bg-stone-50/80 px-2 rounded-xl text-xs transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-600 font-mono font-bold flex items-center justify-center text-[11px]">
                      {history.length - idx}
                    </span>
                    <div>
                      <span className="font-bold text-stone-800 text-sm">
                        {item.student.name}
                      </span>
                      {item.student.seatNumber && (
                        <span className="ml-2 text-stone-400 font-mono text-[11px]">
                          座號 {item.student.seatNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-stone-400">
                      {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>

                    {/* Return to pool option in no-repeat mode */}
                    {repeatMode === 'disallow' && !remainingStudentIds.includes(item.student.id) && (
                      <button
                        type="button"
                        onClick={() => handleReturnToPool(item.student.id)}
                        className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                        title="放回候選池"
                      >
                        <Undo2 className="w-3 h-3" />
                        <span>放回池</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Candidate Status when disallow repeat */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900 pb-3 border-b border-stone-100 flex items-center justify-between">
              <span>待抽清單狀態</span>
              <span className="text-xs font-mono font-semibold text-indigo-600">
                {candidateStudents.length} 人在候選中
              </span>
            </h3>

            <div className="mt-3 max-h-[260px] overflow-y-auto pr-1 flex flex-wrap gap-1.5">
              {students.map((std) => {
                const isDrawn = repeatMode === 'disallow' && !remainingStudentIds.includes(std.id);
                return (
                  <span
                    key={std.id}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                      isDrawn
                        ? 'bg-stone-100 text-stone-300 line-through'
                        : 'bg-indigo-50 text-indigo-800 border border-indigo-100'
                    }`}
                  >
                    {std.seatNumber && <span className="font-mono text-[10px] opacity-60">{std.seatNumber}</span>}
                    <span>{std.name}</span>
                  </span>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-stone-400">
            {repeatMode === 'disallow'
              ? '灰色刪除線代表本次已抽中之學生'
              : '目前模式為「可重複抽取」，人人隨時皆在池中'}
          </div>
        </div>

      </div>

    </div>
  );
}
