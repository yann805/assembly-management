'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
  Assembly,
  Member,
  OfferingCategory,
  Contribution,
  MonthlyReport,
  DashboardData,
  ManagedUser,
  MemberFidelity,
  AssemblyMemberContributionStats,
  PaginatedResponse,
} from '@/types';

// ============ AUTH ============
export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get('/auth/me')).data,
  });
}

// ============ USERS ============
export function useManagedUsers() {
  return useQuery<ManagedUser[]>({
    queryKey: ['managed-users'],
    queryFn: async () => (await api.get('/users')).data,
  });
}

export function useResetManagedUserCredentials() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) =>
      (await api.patch(`/users/${id}/reset-credentials`, { newPassword })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['managed-users'] }),
  });
}

export function useToggleManagedUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.patch(`/users/${id}/toggle-active`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['managed-users'] }),
  });
}

// ============ ASSEMBLIES ============
export function useAssemblies() {
  return useQuery<Assembly[]>({
    queryKey: ['assemblies'],
    queryFn: async () => (await api.get('/assemblies')).data,
  });
}

export function useAssembly(id: string) {
  return useQuery({
    queryKey: ['assembly', id],
    queryFn: async () => (await api.get(`/assemblies/${id}`)).data,
    enabled: !!id,
  });
}

export function useCreateAssembly() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => (await api.post('/assemblies', data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assemblies'] }),
  });
}

export function useUpdateAssembly() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => (await api.patch(`/assemblies/${id}`, data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assemblies'] }),
  });
}

export function useToggleAssemblyStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.patch(`/assemblies/${id}/toggle-status`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assemblies'] }),
  });
}

export function useAssignResponsibility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      (await api.post(`/assemblies/${id}/responsibilities`, data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assemblies'] }),
  });
}

// ============ MEMBERSHIPS ============
export function useAssemblyMemberships(assemblyId: string) {
  return useQuery({
    queryKey: ['memberships', assemblyId],
    queryFn: async () => (await api.get(`/memberships/assembly/${assemblyId}`)).data,
    enabled: !!assemblyId,
  });
}

// ============ MEMBERS ============
export function useMembers(params?: { page?: number; limit?: number; search?: string; assemblyId?: string; status?: string }) {
  return useQuery<PaginatedResponse<Member>>({
    queryKey: ['members', params],
    queryFn: async () => (await api.get('/members', { params })).data,
  });
}

export function useMember(id: string) {
  return useQuery({
    queryKey: ['member', id],
    queryFn: async () => (await api.get(`/members/${id}`)).data,
    enabled: !!id,
  });
}

export function useReferenceData() {
  return useQuery({
    queryKey: ['reference-data'],
    queryFn: async () => (await api.get('/members/reference-data')).data,
  });
}

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => (await api.post('/members', data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => (await api.patch(`/members/${id}`, data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  });
}

export function useDeactivateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.patch(`/members/${id}/deactivate`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  });
}

export function useMemberContributions(id: string) {
  return useQuery({
    queryKey: ['member-contributions', id],
    queryFn: async () => (await api.get(`/members/${id}/contributions`)).data,
    enabled: !!id,
  });
}

// ============ CATEGORIES ============
export function useCategories(includeInactive = false) {
  return useQuery<OfferingCategory[]>({
    queryKey: ['categories', includeInactive],
    queryFn: async () => (await api.get('/categories', { params: { includeInactive } })).data,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => (await api.post('/categories', data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => (await api.patch(`/categories/${id}`, data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/categories/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

// ============ CONTRIBUTIONS ============
export function useContributions(params?: any) {
  return useQuery<PaginatedResponse<Contribution>>({
    queryKey: ['contributions', params],
    queryFn: async () => (await api.get('/contributions', { params })).data,
  });
}

export function useContribution(id: string) {
  return useQuery({
    queryKey: ['contribution', id],
    queryFn: async () => (await api.get(`/contributions/${id}`)).data,
    enabled: !!id,
  });
}

export function useCreateContribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => (await api.post('/contributions', data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contributions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useMonthlyTotals(assemblyId: string, month: number, year: number) {
  return useQuery({
    queryKey: ['monthly-totals', assemblyId, month, year],
    queryFn: async () => (await api.get(`/contributions/monthly-totals/${assemblyId}`, { params: { month, year } })).data,
    enabled: !!assemblyId && !!month && !!year,
  });
}

// ============ REPORTS ============
export function useReports(params?: any) {
  return useQuery<MonthlyReport[]>({
    queryKey: ['reports', params],
    queryFn: async () => (await api.get('/reports', { params })).data,
  });
}

export function useReport(id: string) {
  return useQuery<MonthlyReport>({
    queryKey: ['report', id],
    queryFn: async () => (await api.get(`/reports/${id}`)).data,
    enabled: !!id,
  });
}

export function useGenerateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => (await api.post('/reports/generate', data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  });
}

export function useSubmitReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post(`/reports/${id}/submit`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  });
}

export function useConfirmReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ reportId, data }: { reportId: string; data: any }) =>
      (await api.post(`/confirmations/${reportId}`, data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ============ STATISTICS ============
export function useDashboard(filters?: { assemblyId?: string; month?: number; year?: number }) {
  return useQuery<DashboardData>({
    queryKey: ['dashboard', filters],
    queryFn: async () => (await api.get('/statistics/dashboard', { params: filters })).data,
  });
}

export function useMemberFidelity(memberId: string, year?: number) {
  return useQuery<MemberFidelity>({
    queryKey: ['fidelity', memberId, year],
    queryFn: async () => (await api.get(`/statistics/members/${memberId}/fidelity`, { params: { year } })).data,
    enabled: !!memberId,
  });
}

export function useAssemblyMemberStats(year?: number) {
  return useQuery<AssemblyMemberContributionStats[]>({
    queryKey: ['assembly-member-stats', year],
    queryFn: async () => (await api.get('/statistics/assembly-members', { params: { year } })).data,
  });
}

// ============ AUDIT ============
export function useAuditLogs(params?: any) {
  return useQuery({
    queryKey: ['audit', params],
    queryFn: async () => (await api.get('/audit', { params })).data,
  });
}
