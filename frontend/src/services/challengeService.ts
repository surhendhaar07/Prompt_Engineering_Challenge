import api from './api';
import { Challenge, Question, Submission, ActivityEventType } from '../types';

export interface StartChallengeResponse {
  challenge: Challenge;
  question: Question;
  remaining_seconds: number;
  server_time: string;
}

export interface CurrentChallengeResponse {
  challenge: Challenge | null;
  question?: Question | null;
  remaining_seconds?: number;
  server_time?: string;
  status: string;
}

export async function startChallenge(): Promise<StartChallengeResponse> {
  const response = await api.post<StartChallengeResponse>('/challenges/start');
  return response.data;
}

export async function getCurrentChallenge(): Promise<CurrentChallengeResponse> {
  const response = await api.get<CurrentChallengeResponse>('/challenges/current');
  return response.data;
}

export async function saveDraft(draft: string): Promise<{ success: boolean; saved_at: string }> {
  const response = await api.post<{ success: boolean; saved_at: string }>('/challenges/draft', { draft });
  return response.data;
}

export async function submitChallenge(answer: string, submissionType: 'MANUAL' | 'AUTO' = 'MANUAL'): Promise<{ success: boolean; submission: Submission }> {
  const response = await api.post<{ success: boolean; submission: Submission }>('/challenges/submit', {
    answer,
    submissionType,
  });
  return response.data;
}

export async function logActivity(eventType: ActivityEventType, details?: string, challengeId?: string): Promise<void> {
  try {
    await api.post('/challenges/activity', { eventType, details, challengeId });
  } catch (err) {
    // Non-blocking anti-cheat log
  }
}

export async function getServerTime(): Promise<{ server_time: string; timestamp_ms: number }> {
  const response = await api.get<{ server_time: string; timestamp_ms: number }>('/challenges/time');
  return response.data;
}
