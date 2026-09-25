export type UserRole = 'admin' | 'participant';

export type ChallengeDomain = 'WEB DEVELOPMENT' | 'GEN AI APPLICATION' | 'ANY';

export interface User {
  id: string;
  username: string;
  password_hash: string;
  role: UserRole;
  is_active: number | boolean;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  user_id: string;
  team_name: string;
  team_number?: string;
  domain: ChallengeDomain;
  is_active: number | boolean;
  created_at: string;
  updated_at: string;
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

export type ChallengeStatus = 
  | 'NOT_STARTED' 
  | 'IN_PROGRESS' 
  | 'SUBMITTED' 
  | 'AUTO_SUBMITTED' 
  | 'EXPIRED' 
  | 'RESET';

export type SubmissionType = 'MANUAL' | 'AUTO';

export interface Challenge {
  id: string;
  team_id: string;
  question_id: string;
  started_at: string;
  duration_minutes: number;
  expires_at: string;
  submitted_at?: string | null;
  status: ChallengeStatus;
  submission_type?: SubmissionType | null;
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
  question_id: string;
  answer: string;
  started_at: string;
  submitted_at: string;
  expires_at: string;
  submission_type: SubmissionType;
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

export interface AuthTokenPayload {
  userId: string;
  username: string;
  role: UserRole;
  teamId?: string;
  teamName?: string;
  domain?: ChallengeDomain;
}

export interface RequestWithUser extends Express.Request {
  user?: AuthTokenPayload;
}
