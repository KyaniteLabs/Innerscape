import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface JournalEntry {
  id: string;
  content: string;
  tags: string[];
  createdAt: string;
}

export function useJournal() {
  return useQuery({
    queryKey: ['journal'],
    queryFn: () => api.get<JournalEntry[]>('/api/v1/journal/entries'),
  });
}

export function useCreateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { content: string; tags?: string[] }) =>
      api.post<JournalEntry>('/api/v1/journal/entries', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['journal'] }),
  });
}

export function useDeleteEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/api/v1/journal/entries/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['journal'] }),
  });
}
