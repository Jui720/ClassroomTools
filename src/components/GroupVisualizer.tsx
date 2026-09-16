import { useState, useEffect } from 'react';
import { Users, Shuffle, Copy, Download, Check, AlertCircle, ArrowRightLeft, Sparkles, Sliders } from 'lucide-react';
import { Student, StudentGroup, GroupMode, RemainderStrategy, GroupNamingStyle } from '../types';
import { generateGroups, GROUP_THEME_COLORS } from '../utils/grouping';
import { soundEngine } from '../utils/audio';

interface GroupVisualizerProps {
  students: Student[];
  onNavigateToRoster: () => void;
}

export function GroupVisualizer({ students, onNavigateToRoster }: GroupVisualizerProps) {
  const [mode, setMode] = useState<GroupMode>('bySize');
  const [groupSize, setGroupSize] = useState<number>(4);
  const [groupCount, setGroupCount] = useState<number>(5);
  const [remainderStrategy, setRemainderStrategy] = useState<RemainderStrategy>('distribute');
  const [namingStyle, setNamingStyle] = useState<GroupNamingStyle>('numbers');

  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [copied, setCopied] = useState(false);

  // Manual move modal/state
  const [selectedStudent, setSelectedStudent] = useState<{ student: Student; fromGroupId: string } | null>(null);

  // Auto-generate initial groups when students change or first load
  useEffect(() => {
    if (students.length > 0 && groups.length === 0) {
      handleGenerateGroups(false);
    }
  }, [students]);

  const handleGenerateGroups = (playAudio: boolean = true) => {
    if (students.length === 0) return;

    if (playAudio) {
      setIsShuffling(true);
      soundEngine.playShuffle();
    }

    const value = mode === 'bySize' ? groupSize : groupCount;
    const newGroups = generateGroups(students, {
      mode,
      value,
      remainderStrategy,
      namingStyle,
    });

    if (playAudio) {
      setTimeout(() => {
        setGroups(newGroups);
        setIsShuffling(false);
        soundEngine.playFanfare();
      }, 350);
    } else {
      setGroups(newGroups);
    }
  };

  // Copy formatted group result to clipboard
  const handleCopyGroups = () => {
    if (groups.length === 0) return;
    const text = groups
      .map((g) => {
        const membersStr = g.members.map(m => (m.seatNumber ? `${m.seatNumber}.${m.name}` : m.name)).join('、');
        return `【${g.name}】(${g.members.length}人)\n${membersStr}`;
      })
      .join('\n\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Download groups as CSV
  const handleDownloadCSV = () => {
    if (groups.length === 0) return;
    let csv = '組別,座號,姓名\n';
    groups.forEach(g => {
      g.members.forEach(m => {
        csv += `"${g.name}","${m.seatNumber || ''}","${m.name}"\n`;
      });
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `課堂分組結果_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  // Move a student to another group
  const handleMoveStudent = (targetGroupId: string) => {
    if (!selectedStudent || selectedStudent.fromGroupId === targetGroupId) {
      setSelectedStudent(null);
      return;
    }

    setGroups(prevGroups => {
      return prevGroups.map(g => {
        if (g.id === selectedStudent.fromGroupId) {
          return {
            ...g,
            members: g.members.filter(m => m.id !== selectedStudent.student.id),
          };
        }
        if (g.id === targetGroupId) {
          return {
            ...g,
            members: [...g.members, selectedStudent.student],
          };
        }
        return g;
      });
    });

    setSelectedStudent(null);
    soundEngine.playTick(500);
  };

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-stone-900">尚未建立學生名單</h2>
        <p className="text-sm text-stone-500 mt-1 max-w-md mx-auto">
          請先前往「名單管理」上傳或貼上學生名單，方能進行自動隨機分組。
        </p>
        <button
          type="button"
          onClick={onNavigateToRoster}
          className="mt-6 px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
        >
          前往匯入名單
        </button>
      </div>
    );
  }

  // Calculate estimated preview stats
  const total = students.length;
  let estimatedGroups = 0;
  if (mode === 'bySize') {
    estimatedGroups = remainderStrategy === 'distribute'
      ? Math.max(1, Math.floor(total / groupSize))
      : Math.ceil(total / groupSize);
  } else {
    estimatedGroups = Math.min(total, groupCount);
  }

  return (
    <div className="space-y-6">
      
      {/* Settings Panel Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-stone-900">分組規則與參數設定</h2>
          </div>
          <span className="text-xs text-stone-500">
            全班共 <strong className="text-stone-800 font-mono">{total}</strong> 人
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Setting 1: Group Mode & Value */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-700 block">
              1. 分組方式
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200 text-xs">
              <button
                type="button"
                id="btn-mode-by-size"
                onClick={() => setMode('bySize')}
                className={`py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  mode === 'bySize' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                每組幾人
              </button>
              <button
                type="button"
                id="btn-mode-by-count"
                onClick={() => setMode('byCount')}
                className={`py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  mode === 'byCount' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                分成幾組
              </button>
            </div>

            {/* Value Stepper */}
            <div className="pt-1 flex items-center gap-3">
              {mode === 'bySize' ? (
                <>
                  <div className="flex items-center">
                    <button
                      type="button"
                      id="btn-dec-size"
                      onClick={() => setGroupSize(Math.max(2, groupSize - 1))}
                      className="w-8 h-8 rounded-l-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 flex items-center justify-center font-bold text-sm cursor-pointer"
                    >
                      -
                    </button>
                    <div className="w-14 h-8 flex items-center justify-center border-y border-stone-200 text-sm font-mono font-bold text-stone-900 bg-stone-50">
                      {groupSize} 人
                    </div>
                    <button
                      type="button"
                      id="btn-inc-size"
                      onClick={() => setGroupSize(Math.min(total, groupSize + 1))}
                      className="w-8 h-8 rounded-r-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 flex items-center justify-center font-bold text-sm cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-stone-500">
                    預估分為 <strong>{estimatedGroups}</strong> 組
                  </span>
                </>
              ) : (
                <>
                  <div className="flex items-center">
                    <button
                      type="button"
                      id="btn-dec-count"
                      onClick={() => setGroupCount(Math.max(2, groupCount - 1))}
                      className="w-8 h-8 rounded-l-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 flex items-center justify-center font-bold text-sm cursor-pointer"
                    >
                      -
                    </button>
                    <div className="w-14 h-8 flex items-center justify-center border-y border-stone-200 text-sm font-mono font-bold text-stone-900 bg-stone-50">
                      {groupCount} 組
                    </div>
                    <button
                      type="button"
                      id="btn-inc-count"
                      onClick={() => setGroupCount(Math.min(total, groupCount + 1))}
                      className="w-8 h-8 rounded-r-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 flex items-center justify-center font-bold text-sm cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-stone-500">
                    每組約 <strong>{Math.ceil(total / groupCount)}</strong> 人
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Setting 2: Remainder Distribution */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-700 block">
              2. 餘數人數處理
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200 text-xs">
              <button
                type="button"
                id="btn-strategy-distribute"
                onClick={() => setRemainderStrategy('distribute')}
                className={`py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  remainderStrategy === 'distribute' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
                title="例如多出2人，平均併入前兩組"
              >
                平均分攤至各組
              </button>
              <button
                type="button"
                id="btn-strategy-newgroup"
                onClick={() => setRemainderStrategy('newGroup')}
                className={`py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  remainderStrategy === 'newGroup' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
                title="多出的人自成一小組"
              >
                多出者獨立一組
              </button>
            </div>
            <p className="text-[11px] text-stone-400">
              {remainderStrategy === 'distribute'
                ? '推薦：組別人數最均勻，不會出現人數過少的小組'
                : '嚴格按人數切分，最後一組可能人數較少'}
            </p>
          </div>

          {/* Setting 3: Naming Style */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-700 block">
              3. 小組命名風格
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-stone-100 rounded-xl border border-stone-200 text-xs">
              <button
                type="button"
                id="btn-name-numbers"
                onClick={() => setNamingStyle('numbers')}
                className={`py-1.5 rounded-lg font-medium transition-all cursor-pointer text-center ${
                  namingStyle === 'numbers' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                數字 (第1組)
              </button>
              <button
                type="button"
                id="btn-name-creatives"
                onClick={() => setNamingStyle('creatives')}
                className={`py-1.5 rounded-lg font-medium transition-all cursor-pointer text-center ${
                  namingStyle === 'creatives' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                趣味戰隊
              </button>
              <button
                type="button"
                id="btn-name-colors"
                onClick={() => setNamingStyle('colors')}
                className={`py-1.5 rounded-lg font-medium transition-all cursor-pointer text-center ${
                  namingStyle === 'colors' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                顏色隊別
              </button>
            </div>
            <p className="text-[11px] text-stone-400">
              {namingStyle === 'numbers' ? '標準清晰，適合正式課堂' : namingStyle === 'creatives' ? '增加課堂競賽熱情與趣味度' : '適合彩色旗標與陣營活動'}
            </p>
          </div>

        </div>

        {/* Big Action Bar */}
        <div className="mt-5 pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            id="btn-shuffle-groups-main"
            onClick={() => handleGenerateGroups(true)}
            disabled={isShuffling}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${
              isShuffling
                ? 'bg-emerald-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98'
            }`}
          >
            <Shuffle className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
            <span>{isShuffling ? '隨機洗牌中...' : '立即自動隨機分組'}</span>
          </button>

          {/* Export & Copy Tools */}
          {groups.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                id="btn-copy-groups"
                onClick={handleCopyGroups}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '已複製結果！' : '一鍵複製文字'}</span>
              </button>

              <button
                type="button"
                id="btn-download-groups-csv"
                onClick={handleDownloadCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>下載分組表 (CSV)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Manual Move Helper Bar if a student is picked */}
      {selectedStudent && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-xs text-amber-900 font-medium">
            <ArrowRightLeft className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              正在調整學生：<strong className="font-bold underline">{selectedStudent.student.name}</strong>。請在下方點選要調入的「目標組別」卡片：
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedStudent(null)}
            className="text-xs text-stone-500 hover:text-stone-800 underline cursor-pointer"
          >
            取消調整
          </button>
        </div>
      )}

      {/* Visual Groups Grid */}
      {groups.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-2xl border border-stone-200">
          <Users className="w-10 h-10 text-stone-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-stone-700">尚未產生分組</p>
          <p className="text-xs text-stone-400 mt-1">點擊上方「立即自動隨機分組」即可快速完成全班分組</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {groups.map((group, groupIdx) => {
            const theme = GROUP_THEME_COLORS[groupIdx % GROUP_THEME_COLORS.length];
            const isTargetForMove = selectedStudent && selectedStudent.fromGroupId !== group.id;

            return (
              <div
                key={group.id}
                className={`rounded-2xl border bg-white shadow-xs overflow-hidden flex flex-col justify-between transition-all duration-200 ${
                  isTargetForMove
                    ? 'border-dashed border-amber-400 ring-2 ring-amber-300 bg-amber-50/20 cursor-pointer hover:bg-amber-50/40'
                    : 'border-stone-200 hover:shadow-md'
                }`}
                onClick={() => {
                  if (isTargetForMove) {
                    handleMoveStudent(group.id);
                  }
                }}
              >
                {/* Group Card Header */}
                <div className={`px-4 py-3 border-b flex items-center justify-between ${theme.bg} ${theme.border}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${theme.badge}`}>
                      {groupIdx + 1}
                    </span>
                    <h3 className={`font-bold text-sm ${theme.text}`}>
                      {group.name}
                    </h3>
                  </div>
                  
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border bg-white/80 ${theme.border} ${theme.text}`}>
                    {group.members.length} 人
                  </span>
                </div>

                {/* Group Members List */}
                <div className="p-3 divide-y divide-stone-100 flex-1 min-h-[140px]">
                  {group.members.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-stone-400 italic py-6">
                      (暫無成員)
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {group.members.map((member) => {
                        const isBeingMoved = selectedStudent?.student.id === member.id;
                        return (
                          <div
                            key={member.id}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors group/item ${
                              isBeingMoved
                                ? 'bg-amber-100 text-amber-900 font-bold ring-1 ring-amber-400'
                                : 'hover:bg-stone-50 text-stone-800'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {member.seatNumber && (
                                <span className="font-mono text-[11px] text-stone-400 shrink-0 font-medium">
                                  {member.seatNumber}
                                </span>
                              )}
                              <span className="font-semibold truncate">
                                {member.name}
                              </span>
                            </div>

                            {/* Move button on hover */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudent({
                                  student: member,
                                  fromGroupId: group.id,
                                });
                              }}
                              className="opacity-0 group-hover/item:opacity-100 text-[11px] text-stone-500 hover:text-indigo-600 hover:bg-indigo-50 px-1.5 py-0.5 rounded transition-opacity cursor-pointer shrink-0"
                              title="調換或移到其他組"
                            >
                              移動
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Target Drop Helper Prompt */}
                {isTargetForMove && (
                  <div className="p-2 bg-amber-100/70 border-t border-amber-200 text-center text-[11px] font-bold text-amber-800">
                    點擊移入此組
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Teacher tips at bottom */}
      <div className="bg-stone-50 rounded-2xl border border-stone-200 p-4 text-xs text-stone-500 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <p>
          <strong>課堂教學小技巧：</strong>分組完成後，您可以將滑鼠移至學生姓名上方點擊「移動」，輕鬆微調組員。完成後點擊「一鍵複製文字」，即可直接張貼至班級群組或投影在電子白板上。
        </p>
      </div>

    </div>
  );
}
