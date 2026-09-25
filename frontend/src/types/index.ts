export type UserRole = 'admin' | 'participant';

export type ChallengeDomain = 'WEB DEVELOPMENT' | 'GEN AI APPLICATION' | 'ANY';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  teamId?: string;
  teamName?: string;
  teamNumber?: string;
  domain?: ChallengeDomain;
}

export interface Team {
  id: string;
  user_id: string;
  team_name: string;
  team_number?: string;
  domain: ChallengeDomain;
  is_active: number | boolean;
  is_online?: boolean;
  challenge_status?: string;
  created_at: string;
  updated_at: string;
  challenge?: {
    id: string;
    question_id: string;
    question_title?: string;
    question_domain?: ChallengeDomain;
    question_text?: string;
    status: string;
    started_at: string;
    expires_at: string;
    submitted_at?: string | null;
    submission_type?: 'MANUAL' | 'AUTO' | null;
    remaining_seconds: number;
    tab_switch_count: number;
    fullscreen_exit_count: number;
    copy_attempt_count: number;
    paste_attempt_count: number;
  } | null;
}

export interface Question {
  id: string;
  domain: ChallengeDomain;
  title: string;
  situation: string;
  task: string;
  requirements: string;
  technical_requirements: string;
  submission_guideline: string;
  question_text: string;
  category: string;
  difficulty: string;
  is_active: number | boolean;
  created_at: string;
  updated_at: string;
}

export interface Challenge {
  id: string;
  team_id: string;
  question_id: string;
  started_at: string;
  duration_minutes: number;
  expires_at: string;
  submitted_at?: string | null;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMITTED' | 'EXPIRED' | 'RESET';
  submission_type?: 'MANUAL' | 'AUTO' | null;
  current_draft?: string;
  tab_switch_count: number;
  fullscreen_exit_count: number;
  copy_attempt_count: number;
  paste_attempt_count: number;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  challenge_id: string;
  team_id: string;
  team_name?: string;
  team_number?: string;
  team_domain?: string;
  question_id: string;
  question_title?: string;
  question_domain?: string;
  question_situation?: string;
  question_task?: string;
  question_requirements?: string;
  question_technical_requirements?: string;
  question_submission_guideline?: string;
  question_text?: string;
  question_category?: string;
  question_difficulty?: string;
  answer: string;
  started_at: string;
  submitted_at: string;
  expires_at: string;
  submission_type: 'MANUAL' | 'AUTO';
  duration_used_seconds: number;
  tab_switch_count: number;
  fullscreen_exit_count: number;
  copy_attempt_count: number;
  paste_attempt_count: number;
  status: string;
  created_at: string;
}

export type ActivityEventType =
  | 'LOGIN'
  | 'START'
  | 'TAB_SWITCH'
  | 'FULLSCREEN_EXIT'
  | 'WINDOW_BLUR'
  | 'WINDOW_FOCUS'
  | 'COPY_ATTEMPT'
  | 'PASTE_ATTEMPT'
  | 'CUT_ATTEMPT'
  | 'RIGHT_CLICK'
  | 'SCREENSHOT_ATTEMPT'
  | 'EXTENSION_DETECTED'
  | 'DEVTOOLS_DETECTED'
  | 'DRAFT_SAVE'
  | 'SUBMIT_MANUAL'
  | 'SUBMIT_AUTO'
  | 'RECONNECT';

export interface ActivityLog {
  id: string;
  team_id: string;
  team_name: string;
  challenge_id?: string | null;
  event_type: ActivityEventType;
  details?: string | null;
  timestamp: string;
  isSecurityAlert?: boolean;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  admin_username: string;
  action: string;
  target_type: string;
  target_id?: string | null;
  details?: string | null;
  timestamp: string;
}

export interface SystemSettings {
  challenge_duration_minutes: number;
  active_questions_count: number;
  random_assignment_enabled: boolean;
  unique_questions_enabled: boolean;
  copy_paste_monitoring_enabled: boolean;
  tab_switch_monitoring_enabled: boolean;
  fullscreen_monitoring_enabled: boolean;
  right_click_prevention_enabled: boolean;
  allow_manual_reassign: boolean;
}

export interface DashboardStats {
  totalTeams: number;
  activeTeams: number;
  onlineTeams: number;
  inProgressTeams: number;
  completedTeams: number;
  notStartedTeams: number;
  alertCount: number;
  activeQuestions: number;
  totalQuestions: number;
  recentActivity: ActivityLog[];
  teams: Team[];
}
