import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RosterManager } from './components/RosterManager';
import { LuckyDraw } from './components/LuckyDraw';
import { GroupVisualizer } from './components/GroupVisualizer';
import { Student } from './types';
import { SAMPLE_STUDENTS } from './utils/parser';

const STORAGE_KEY = 'class_roster_students_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'roster' | 'draw' | 'groups'>('draw');
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    // Default to sample students for instant delightful experience
    return SAMPLE_STUDENTS;
  });

  // Persist students to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
    } catch {
      // ignore
    }
  }, [students]);

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        studentCount={students.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'roster' && (
          <RosterManager
            students={students}
            setStudents={setStudents}
            onNavigateToDraw={() => setActiveTab('draw')}
            onNavigateToGroups={() => setActiveTab('groups')}
          />
        )}

        {activeTab === 'draw' && (
          <LuckyDraw
            students={students}
            onNavigateToRoster={() => setActiveTab('roster')}
          />
        )}

        {activeTab === 'groups' && (
          <GroupVisualizer
            students={students}
            onNavigateToRoster={() => setActiveTab('roster')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white/70 py-4 text-center text-xs text-stone-500">
        <p>班級點名抽籤與自動分組小工具 ‧ 專為課堂與教學設計</p>
      </footer>
    </div>
  );
}
