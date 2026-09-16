import { GroupConfig, GroupNamingStyle, Student, StudentGroup } from '../types';

export const GROUP_THEME_COLORS = [
  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', badge: 'bg-emerald-500 text-white', ring: 'ring-emerald-400' },
  { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-800', badge: 'bg-sky-500 text-white', ring: 'ring-sky-400' },
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', badge: 'bg-amber-500 text-white', ring: 'ring-amber-400' },
  { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800', badge: 'bg-indigo-500 text-white', ring: 'ring-indigo-400' },
  { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800', badge: 'bg-rose-500 text-white', ring: 'ring-rose-400' },
  { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-800', badge: 'bg-violet-500 text-white', ring: 'ring-violet-400' },
  { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-800', badge: 'bg-teal-500 text-white', ring: 'ring-teal-400' },
  { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', badge: 'bg-orange-500 text-white', ring: 'ring-orange-400' },
  { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-800', badge: 'bg-pink-500 text-white', ring: 'ring-pink-400' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-800', badge: 'bg-cyan-500 text-white', ring: 'ring-cyan-400' },
  { bg: 'bg-lime-50', border: 'border-lime-200', text: 'text-lime-800', badge: 'bg-lime-500 text-white', ring: 'ring-lime-400' },
  { bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', text: 'text-fuchsia-800', badge: 'bg-fuchsia-500 text-white', ring: 'ring-fuchsia-400' },
];

const CREATIVE_NAMES = [
  '烈火鳳凰隊', '極速獵豹隊', '深海藍鯨隊', '奇蹟火箭隊',
  '璀璨星辰隊', '智慧精靈隊', '雷霆戰神隊', '森林巨熊隊',
  '無敵霸王龍隊', '飛天神鷹隊', '黃金獅王隊', '追風少年隊',
  '探險先鋒隊', '破浪蛟龍隊', '銀河戰艦隊', '超能英雄隊',
];

const COLOR_NAMES = [
  '紅隊', '藍隊', '綠隊', '黃隊', '紫隊', '橙隊', '青隊', '粉隊',
  '金隊', '銀隊', '黑隊', '白隊',
];

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateGroups(
  students: Student[],
  config: {
    mode: 'bySize' | 'byCount';
    value: number;
    remainderStrategy: 'distribute' | 'newGroup';
    namingStyle: GroupNamingStyle;
  }
): StudentGroup[] {
  if (students.length === 0) return [];

  const shuffled = shuffleArray(students);
  const total = shuffled.length;
  let targetNumGroups = 1;

  if (config.mode === 'byCount') {
    targetNumGroups = Math.max(1, Math.min(config.value, total));
  } else {
    const targetSize = Math.max(1, config.value);
    if (config.remainderStrategy === 'distribute') {
      targetNumGroups = Math.max(1, Math.floor(total / targetSize));
    } else {
      targetNumGroups = Math.ceil(total / targetSize);
    }
  }

  // Initialize groups
  const groups: StudentGroup[] = [];
  for (let i = 0; i < targetNumGroups; i++) {
    let name = `第 ${i + 1} 組`;
    if (config.namingStyle === 'creatives') {
      name = CREATIVE_NAMES[i % CREATIVE_NAMES.length];
    } else if (config.namingStyle === 'colors') {
      name = COLOR_NAMES[i % COLOR_NAMES.length];
    }

    groups.push({
      id: `group-${i + 1}`,
      name,
      color: String(i % GROUP_THEME_COLORS.length),
      members: [],
    });
  }

  // Distribute students evenly into groups
  if (config.mode === 'bySize' && config.remainderStrategy === 'newGroup') {
    const targetSize = Math.max(1, config.value);
    let groupIdx = 0;
    for (let i = 0; i < total; i++) {
      if (groups[groupIdx].members.length >= targetSize && groupIdx < groups.length - 1) {
        groupIdx++;
      }
      groups[groupIdx].members.push(shuffled[i]);
    }
  } else {
    // Round-robin distribution ensures completely balanced sizes
    for (let i = 0; i < total; i++) {
      const groupIdx = i % targetNumGroups;
      groups[groupIdx].members.push(shuffled[i]);
    }
  }

  // Filter out any empty groups
  return groups.filter(g => g.members.length > 0);
}
