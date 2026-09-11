import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api.js';

const get = (url, params) => api.get(url, { params }).then((r) => r.data);

export const useNotifications = () =>
  useQuery({
    queryKey: ['notifications'],
    queryFn: () => get('/notifications'),
    refetchInterval: 20000,
  });

export const useStudies = (type) =>
  useQuery({ queryKey: ['studies', type || 'all'], queryFn: () => get('/studies', type ? { type } : undefined) });

export const useStudy = (id) =>
  useQuery({ queryKey: ['study', id], queryFn: () => get(`/studies/${id}`), enabled: !!id });

export const useDoctors = (q) =>
  useQuery({ queryKey: ['doctors', q || ''], queryFn: () => get('/doctors', q ? { q } : undefined) });

export const useLinks = () => useQuery({ queryKey: ['links'], queryFn: () => get('/links') });

export const useShares = () => useQuery({ queryKey: ['shares'], queryFn: () => get('/shares') });

export const useNotes = (patientId) =>
  useQuery({
    queryKey: ['notes', patientId || 'mine'],
    queryFn: () => get('/notes', patientId ? { patientId } : undefined),
  });

export const usePatients = () =>
  useQuery({ queryKey: ['patients'], queryFn: () => get('/patients') });

export const usePatientDetail = (id) =>
  useQuery({ queryKey: ['patient', id], queryFn: () => get(`/patients/${id}`), enabled: !!id });

export const useAdminStats = () =>
  useQuery({ queryKey: ['admin', 'stats'], queryFn: () => get('/admin/stats') });

export const useAdminUsers = (params) =>
  useQuery({ queryKey: ['admin', 'users', params], queryFn: () => get('/admin/users', params) });

export const useAdminStudies = (params) =>
  useQuery({ queryKey: ['admin', 'studies', params], queryFn: () => get('/admin/studies', params) });

export const useAdminAudit = (params) =>
  useQuery({ queryKey: ['admin', 'audit', params], queryFn: () => get('/admin/audit', params) });

export const useAiHealth = () =>
  useQuery({ queryKey: ['ai-health'], queryFn: () => get('/health/ai'), refetchInterval: 30000, retry: false });

export function useInvalidate() {
  const qc = useQueryClient();
  return (...keys) => keys.forEach((k) => qc.invalidateQueries({ queryKey: Array.isArray(k) ? k : [k] }));
}

export { useMutation };
