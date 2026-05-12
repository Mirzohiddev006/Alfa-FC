export interface CoachGroup {
  id: number;
  name: string;
}

export interface PerformanceMatch {
  id: number;
  match_date: string;
  tour_label: string;
  opponent: string;
}

export interface PerformanceRow {
  student_id: number;
  student_name: string;
  millati?: string;
  cells: Array<string | number | null>;
}

export interface GroupPerformanceTable {
  matches: PerformanceMatch[];
  rows: PerformanceRow[];
}
