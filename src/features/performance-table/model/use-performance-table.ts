import { useQuery } from '@tanstack/react-query';
import { getCoachGroups, getGroupPerformanceTable } from '../../../entities/performance/api/performance-api';

export function useCoachGroupsQuery() {
  return useQuery({
    queryKey: ['coach-groups'],
    queryFn: getCoachGroups,
    staleTime: 60_000,
  });
}

export function useGroupPerformanceTableQuery(groupId: string | number, seasonYear: number) {
  return useQuery({
    queryKey: ['group-performance-table', String(groupId || ''), seasonYear],
    queryFn: () => getGroupPerformanceTable(groupId, seasonYear),
    enabled: Boolean(groupId),
  });
}
