import { http } from '../../../shared/api/http';
import type { ApiResponse } from '../../../shared/types/api';
import type { CoachGroup, GroupPerformanceTable } from '../types/performance';

export async function getCoachGroups(): Promise<CoachGroup[]> {
  const { data } = await http.get<ApiResponse<CoachGroup[]>>('/coach/groups');
  return Array.isArray(data?.data) ? data.data : [];
}

export async function getGroupPerformanceTable(groupId: string | number, seasonYear: number): Promise<GroupPerformanceTable | null> {
  try {
    const { data } = await http.get<ApiResponse<GroupPerformanceTable>>(`/coach/groups/${groupId}/performance-table`, {
      params: { season_year: seasonYear },
    });

    console.log('Performance API response:', { data, groupId, seasonYear });

    if (!data?.data) {
      console.warn('No data in performance response', { data });
      return null;
    }
    return data.data;
  } catch (err) {
    console.error('Performance API error:', err, { groupId, seasonYear });
    throw err;
  }
}
