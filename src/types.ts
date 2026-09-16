export interface Student {
  id: string;
  name: string;
  seatNumber?: string;
  gender?: 'M' | 'F' | 'other';
}

export type DrawRepetitionMode = 'allow' | 'disallow';

export interface DrawHistoryItem {
  id: string;
  student: Student;
  timestamp: Date;
  round: number;
}

export type GroupMode = 'bySize' | 'byCount';

export type RemainderStrategy = 'distribute' | 'newGroup';

export type GroupNamingStyle = 'numbers' | 'creatives' | 'colors';

export interface GroupConfig {
  mode: GroupMode;
  value: number;
  remainderStrategy: RemainderStrategy;
  namingStyle: GroupNamingStyle;
}

export interface StudentGroup {
  id: string;
  name: string;
  color: string;
  members: Student[];
}
