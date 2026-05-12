import { http } from '../../../shared/api/http';
import type { ApiResponse } from '../../../shared/types/api';
import type { CoachGroup, GroupPerformanceTable } from '../types/performance';

export async function getCoachGroups(): Promise<CoachGroup[]> {
  const { data } = await http.get<ApiResponse<CoachGroup[]>>('/coach/groups');
  return Array.isArray(data?.data) ? data.data : [];
}

export async function getGroupPerformanceTable(groupId: string | number, seasonYear: number): Promise<GroupPerformanceTable | null> {
  const { data } = await http.get<ApiResponse<GroupPerformanceTable>>(`/coach/groups/${groupId}/performance-table`, {
    params: { season_year: seasonYear },
  });

  if (!data?.data) return null;
  return data.data;
}
