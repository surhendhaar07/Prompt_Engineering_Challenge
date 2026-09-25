import api from './api';
import {
  DashboardStats,
  Team,
  Question,
  Submission,
  ActivityLog,
  AdminAuditLog,
  SystemSettings,
  ChallengeDomain
} from '../types';

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await api.get<DashboardStats>('/admin/dashboard');
  return response.data;
}

// Teams
export async function getTeams(): Promise<Team[]> {
  const response = await api.get<Team[]>('/admin/teams');
  return response.data;
}

export async function getTeamDetails(id: string): Promise<any> {
  const response = await api.get(`/admin/teams/${id}`);
  return response.data;
}

export async function createTeam(data: { team_name: string; password: string; team_number?: string; domain?: ChallengeDomain }): Promise<{ message: string; team: Team }> {
  const response = await api.post('/admin/teams', data);
  return response.data;
}

export async function updateTeam(id: string, data: { team_name?: string; team_number?: string; domain?: ChallengeDomain; is_active?: boolean | number }): Promise<{ message: string; team: Team }> {
  const response = await api.put(`/admin/teams/${id}`, data);
  return response.data;
}

export async function changeTeamPassword(id: string, password: string): Promise<{ message: string }> {
  const response = await api.put(`/admin/teams/${id}/password`, { password });
  return response.data;
}

export async function deleteTeam(id: string): Promise<{ message: string }> {
  const response = await api.delete(`/admin/teams/${id}`);
  return response.data;
}

export async function reassignChallenge(teamId: string, options: { questionId?: string; durationMinutes?: number } = {}): Promise<any> {
  const response = await api.post(`/admin/teams/${teamId}/reassign`, options);
  return response.data;
}

export async function resetChallenge(teamId: string): Promise<any> {
  const response = await api.post(`/admin/teams/${teamId}/reset`);
  return response.data;
}

// Questions
export async function getQuestions(): Promise<Question[]> {
  const response = await api.get<Question[]>('/admin/questions');
  return response.data;
}

export async function createQuestion(data: {
  domain?: ChallengeDomain;
  title: string;
  situation: string;
  task: string;
  requirements: string;
  technical_requirements: string;
  submission_guideline?: string;
  category?: string;
  difficulty?: string;
}): Promise<{ message: string; question: Question }> {
  const response = await api.post('/admin/questions', data);
  return response.data;
}

export async function updateQuestion(
  id: string,
  data: {
    domain?: ChallengeDomain;
    title?: string;
    situation?: string;
    task?: string;
    requirements?: string;
    technical_requirements?: string;
    submission_guideline?: string;
    category?: string;
    difficulty?: string;
    is_active?: boolean | number;
  }
): Promise<{ message: string; question: Question }> {
  const response = await api.put(`/admin/questions/${id}`, data);
  return response.data;
}

export async function toggleQuestion(id: string): Promise<{ message: string; question: Question }> {
  const response = await api.put(`/admin/questions/${id}/toggle`);
  return response.data;
}

export async function deleteQuestion(id: string): Promise<{ message: string }> {
  const response = await api.delete(`/admin/questions/${id}`);
  return response.data;
}

// Submissions
export async function getSubmissions(): Promise<Submission[]> {
  const response = await api.get<Submission[]>('/admin/submissions');
  return response.data;
}

export async function getSubmissionById(id: string): Promise<Submission> {
  const response = await api.get<Submission>(`/admin/submissions/${id}`);
  return response.data;
}

// Logs
export async function getActivityLogs(params: { teamId?: string; eventType?: string; limit?: number; offset?: number } = {}): Promise<{ logs: ActivityLog[]; total: number }> {
  const response = await api.get('/admin/activity', { params });
  return response.data;
}

export async function getAuditLogs(limit = 100): Promise<AdminAuditLog[]> {
  const response = await api.get<AdminAuditLog[]>('/admin/audit', { params: { limit } });
  return response.data;
}

// Settings
export async function getSettings(): Promise<SystemSettings> {
  const response = await api.get<SystemSettings>('/admin/settings');
  return response.data;
}

export async function updateSettings(settings: Partial<SystemSettings>): Promise<{ message: string; settings: SystemSettings }> {
  const response = await api.put('/admin/settings', settings);
  return response.data;
}

// Multi-Format Export: Word, Excel, PDF, CSV
export async function downloadExportReport(format: 'excel' | 'word' | 'pdf' | 'csv'): Promise<void> {
  const token = localStorage.getItem('xentrix_token');
  const response = await api.get(`/admin/export/${format}`, {
    responseType: 'blob',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const extensions: Record<string, string> = {
    word: 'docx',
    excel: 'xlsx',
    pdf: 'pdf',
    csv: 'csv',
  };

  const ext = extensions[format] || format;
  const mimeTypes: Record<string, string> = {
    word: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pdf: 'application/pdf',
    csv: 'text/csv',
  };

  const blob = new Blob([response.data], { type: mimeTypes[format] || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `xentrix26_results_${new Date().toISOString().slice(0, 10)}.${ext}`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
