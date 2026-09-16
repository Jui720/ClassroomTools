import { Student } from '../types';

export const SAMPLE_STUDENTS: Student[] = [
  { id: 'std-1', seatNumber: '01', name: '陳柏宇' },
  { id: 'std-2', seatNumber: '02', name: '林子晴' },
  { id: 'std-3', seatNumber: '03', name: '黃冠廷' },
  { id: 'std-4', seatNumber: '04', name: '張庭瑀' },
  { id: 'std-5', seatNumber: '05', name: '李承翰' },
  { id: 'std-6', seatNumber: '06', name: '王心妤' },
  { id: 'std-7', seatNumber: '07', name: '吳睿恩' },
  { id: 'std-8', seatNumber: '08', name: '劉品妍' },
  { id: 'std-9', seatNumber: '09', name: '蔡宗翰' },
  { id: 'std-10', seatNumber: '10', name: '楊雅淳' },
  { id: 'std-11', seatNumber: '11', name: '許家瑋' },
  { id: 'std-12', seatNumber: '12', name: '鄭宇軒' },
  { id: 'std-13', seatNumber: '13', name: '謝沛辰' },
  { id: 'std-14', seatNumber: '14', name: '洪語婕' },
  { id: 'std-15', seatNumber: '15', name: '郭宥廷' },
  { id: 'std-16', seatNumber: '16', name: '邱詩涵' },
  { id: 'std-17', seatNumber: '17', name: '曾俊傑' },
  { id: 'std-18', seatNumber: '18', name: '廖若安' },
  { id: 'std-19', seatNumber: '19', name: '賴彥廷' },
  { id: 'std-20', seatNumber: '20', name: '徐羽彤' },
  { id: 'std-21', seatNumber: '21', name: '周楷峰' },
  { id: 'std-22', seatNumber: '22', name: '葉佳穎' },
  { id: 'std-23', seatNumber: '23', name: '蘇靖雯' },
  { id: 'std-24', seatNumber: '24', name: '莊凱程' },
  { id: 'std-25', seatNumber: '25', name: '江依玲' },
  { id: 'std-26', seatNumber: '26', name: '呂侑倫' },
  { id: 'std-27', seatNumber: '27', name: '何思穎' },
  { id: 'std-28', seatNumber: '28', name: '羅晨恩' },
  { id: 'std-29', seatNumber: '29', name: '蕭博元' },
  { id: 'std-30', seatNumber: '30', name: '潘芷柔' },
];

/**
 * Parses raw text or CSV content into a list of students
 */
export function parseRosterInput(text: string): Student[] {
  if (!text || !text.trim()) return [];

  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const students: Student[] = [];

  // If there is only one line with commas or spaces, split by separator
  if (lines.length === 1 && (text.includes(',') || text.includes('，') || text.includes('、') || text.includes(' '))) {
    const rawTokens = text
      .split(/[,，、\s\t]+/)
      .map(t => t.trim())
      .filter(t => t.length > 0);

    return rawTokens.map((tok, idx) => ({
      id: `p-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      name: tok,
      seatNumber: String(idx + 1).padStart(2, '0'),
    }));
  }

  // Check if first line looks like a header (e.g. 座號,姓名 or Number,Name)
  let startIndex = 0;
  if (lines.length > 0) {
    const first = lines[0].toLowerCase();
    if (
      first.includes('姓名') ||
      first.includes('座號') ||
      first.includes('學號') ||
      first.includes('name') ||
      first.includes('number') ||
      first.includes('student')
    ) {
      startIndex = 1;
    }
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    // Split by comma, tab, or multiple spaces
    let cells: string[] = [];

    if (line.includes(',')) {
      // Basic CSV split
      cells = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
    } else if (line.includes('\t')) {
      cells = line.split('\t').map(c => c.trim());
    } else {
      // Split by whitespace
      cells = line.split(/\s+/).map(c => c.trim());
    }

    cells = cells.filter(c => c.length > 0);
    if (cells.length === 0) continue;

    let seatNumber = String(students.length + 1).padStart(2, '0');
    let name = '';

    if (cells.length === 1) {
      name = cells[0];
    } else if (cells.length >= 2) {
      // Check if first cell is a number
      if (/^\d+$/.test(cells[0])) {
        seatNumber = cells[0].padStart(2, '0');
        name = cells[1];
      } else if (/^\d+$/.test(cells[1])) {
        seatNumber = cells[1].padStart(2, '0');
        name = cells[0];
      } else {
        // Just take first cell as seat/id and second as name
        seatNumber = cells[0];
        name = cells[1];
      }
    }

    if (name) {
      students.push({
        id: `s-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        name,
        seatNumber,
      });
    }
  }

  return students;
}

export function exportRosterToCSV(students: Student[]): string {
  const header = '座號,學生姓名\n';
  const rows = students.map(s => `"${s.seatNumber || ''}","${s.name}"`).join('\n');
  return header + rows;
}
