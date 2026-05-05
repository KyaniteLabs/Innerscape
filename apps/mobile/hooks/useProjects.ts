import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Project {
  id: string;
  name: string;
  area: string;
  status: string;
  deadline: string;
  createdAt: string;
}

export function useProjects(status = 'active', area?: string) {
  return useQuery({
    queryKey: ['projects', status, area],
    queryFn: () => {
      const params = new URLSearchParams({ status });
      if (area) params.set('area', area);
      return api.get<Project[]>(`/api/v1/projects?${params}`);
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; area?: string; deadline?: string }) =>
      api.post<Project>('/api/v1/projects', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useArchiveProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/v1/projects/${id}/archive`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}
