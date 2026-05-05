import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  paraCategory: string;
  tags: string[];
  lastAccessedAt: string;
  createdAt: string;
}

export function useKnowledge(category?: string, search?: string) {
  return useQuery({
    queryKey: ['knowledge', category, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (search) params.set('search', search);
      const qs = params.toString();
      return api.get<KnowledgeItem[]>(`/api/v1/knowledge${qs ? `?${qs}` : ''}`);
    },
  });
}

export function useCreateKnowledge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; content: string; paraCategory?: string; tags?: string[] }) =>
      api.post<KnowledgeItem>('/api/v1/knowledge', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['knowledge'] }),
  });
}

export function useDeleteKnowledge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/api/v1/knowledge/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['knowledge'] }),
  });
}
