import React, { useState, useRef } from 'react';
import { Upload, FileText, Trash2, Plus, Download, Sparkles, AlertCircle, CheckCircle2, Search, ArrowRight } from 'lucide-react';
import { Student } from '../types';
import { parseRosterInput, exportRosterToCSV, SAMPLE_STUDENTS } from '../utils/parser';

interface RosterManagerProps {
  students: Student[];
  setStudents: (students: Student[]) => void;
  onNavigateToDraw: () => void;
  onNavigateToGroups: () => void;
}

export function RosterManager({ students, setStudents, onNavigateToDraw, onNavigateToGroups }: RosterManagerProps) {
  const [pasteText, setPasteText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSeat, setNewSeat] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = parseRosterInput(content);
        if (parsed.length === 0) {
          showNotification('error', '檔案中未偵測到有效的學生姓名，請確認格式');
          return;
        }
        setStudents(parsed);
        showNotification('success', `成功匯入 ${parsed.length} 位學生名單！`);
      } catch {
        showNotification('error', '讀取檔案失敗，請使用 UTF-8 編碼之 CSV 或 TXT 檔');
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handlePasteImport = () => {
    if (!pasteText.trim()) {
      showNotification('error', '請先在文字框中貼上或輸入學生姓名');
      return;
    }
    const parsed = parseRosterInput(pasteText);
    if (parsed.length === 0) {
      showNotification('error', '無法解析任何有效姓名，請確認格式');
      return;
    }
    setStudents(parsed);
    setPasteText('');
    showNotification('success', `成功建立 ${parsed.length} 位學生名單！`);
  };

  const handleLoadSample = () => {
    setStudents(SAMPLE_STUDENTS);
    showNotification('success', `已載入全班 30 位範例學生名單！`);
  };

  const handleClearAll = () => {
    if (confirm('確定要清空目前所有名單嗎？')) {
      setStudents([]);
      showNotification('success', '名單已清空');
    }
  };

  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const nextSeat = newSeat.trim() || String(students.length + 1).padStart(2, '0');
    const newStudent: Student = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: newName.trim(),
      seatNumber: nextSeat,
    };
    setStudents([...students, newStudent]);
    setNewName('');
    setNewSeat('');
    showNotification('success', `已新增學生「${newStudent.name}」`);
  };

  const handleDeleteStudent = (id: string, name: string) => {
    setStudents(students.filter(s => s.id !== id));
    showNotification('success', `已移除學生「${name}」`);
  };

  const handleDownloadCSV = () => {
    if (students.length === 0) {
      showNotification('error', '目前名單為空，無法匯出');
      return;
    }
    const csvContent = exportRosterToCSV(students);
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `班級學生名單_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.seatNumber && s.seatNumber.includes(searchQuery))
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Action Banner for Empty or Ready State */}
      {students.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 via-white to-indigo-50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base">
              {students.length}
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900">
                名單已備妥，共 {students.length} 位學生
              </p>
              <p className="text-xs text-stone-500">
                可立即前往「隨機抽籤」進行點名互動，或使用「自動分組」進行小組討論
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              id="btn-goto-draw"
              onClick={onNavigateToDraw}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <span>前往隨機抽籤</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              id="btn-goto-groups"
              onClick={onNavigateToGroups}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <span>前往自動分組</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Input Methods: 2-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Method 1: CSV File Upload */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-stone-900">方法一：上傳名單檔案 (CSV / TXT)</h2>
              </div>
            </div>

            <p className="text-xs text-stone-500 mb-4">
              支援 Excel/Numbers 匯出的 <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-700">.csv</code> 或純文字 <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-700">.txt</code>。可包含「座號,姓名」欄位或單純姓名。
            </p>

            <div
              id="csv-dropzone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                  : 'border-stone-300 hover:border-indigo-400 hover:bg-stone-50/70'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,text/csv,text/plain"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-800">
                    點擊選擇檔案 或 將檔案拖曳至此
                  </p>
                  <p className="text-xs text-stone-400 mt-1">
                    支援 CSV 或 TXT (UTF-8 編碼)
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs text-stone-400">想先快速體驗功能？</span>
            <button
              type="button"
              id="btn-load-sample"
              onClick={handleLoadSample}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>載入 30 人範例名單</span>
            </button>
          </div>
        </div>

        {/* Method 2: Direct Paste */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-stone-900">方法二：直接貼上學生姓名</h2>
              </div>
            </div>

            <p className="text-xs text-stone-500 mb-2">
              可以直接複製整排名字貼上，支援換行、頓號（、）、逗號（,）或空白間隔。
            </p>

            <textarea
              id="textarea-paste-roster"
              rows={4}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="例如：&#10;01 陳柏宇&#10;02 林子晴&#10;03 黃冠廷&#10;或直接貼上：張三、李四、王五、趙六..."
              className="w-full text-xs font-mono p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none bg-stone-50"
            />
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPasteText('')}
              className="text-xs text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
            >
              清空輸入框
            </button>
            <button
              type="button"
              id="btn-import-paste"
              onClick={handlePasteImport}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <span>建立/替換為此名單</span>
            </button>
          </div>
        </div>

      </div>

      {/* Current Roster Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-3">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <span>目前班級名單</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                共 {students.length} 位學生
              </span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              名單會自動保存於此瀏覽器，關閉頁面不遺失
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋姓名或座號..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-36 sm:w-44 bg-stone-50"
              />
            </div>

            {/* Export CSV */}
            {students.length > 0 && (
              <button
                type="button"
                id="btn-export-csv"
                onClick={handleDownloadCSV}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-medium transition-colors cursor-pointer"
                title="下載備份"
              >
                <Download className="w-3.5 h-3.5" />
                <span>匯出 CSV</span>
              </button>
            )}

            {/* Clear All */}
            {students.length > 0 && (
              <button
                type="button"
                id="btn-clear-roster"
                onClick={handleClearAll}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-medium transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>清空名單</span>
              </button>
            )}
          </div>
        </div>

        {/* Add single student bar */}
        <form onSubmit={handleAddSingle} className="flex flex-wrap items-center gap-2 pt-4 pb-2">
          <input
            type="text"
            placeholder="座號 (選填)"
            value={newSeat}
            onChange={(e) => setNewSeat(e.target.value)}
            className="w-24 px-3 py-1.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
          <input
            type="text"
            placeholder="輸入新學生姓名..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 min-w-[140px] px-3 py-1.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
          <button
            type="submit"
            id="btn-add-single-student"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新增學生</span>
          </button>
        </form>

        {/* Students Chips / Grid */}
        {students.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-stone-700">目前尚無名單</p>
            <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
              請從上方上傳 CSV 檔案、直接貼上學生姓名，或點擊「載入 30 人範例名單」快速開始。
            </p>
            <button
              type="button"
              onClick={handleLoadSample}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>立即載入範例名單</span>
            </button>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-500">
            找不到符合「{searchQuery}」的學生
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 max-h-[380px] overflow-y-auto pr-1">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="group relative flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  {student.seatNumber && (
                    <span className="text-[11px] font-mono text-stone-400 font-semibold shrink-0">
                      {student.seatNumber}
                    </span>
                  )}
                  <span className="font-semibold text-stone-800 truncate">
                    {student.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteStudent(student.id, student.name)}
                  className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-600 p-1 rounded-md transition-opacity cursor-pointer shrink-0"
                  title="移除此學生"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
