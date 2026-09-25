import { v4 as uuidv4 } from 'uuid';
import * as db from '../db';
import { Question, ChallengeDomain } from '../types';
import { logAdminAction } from './auditService';

export async function getAllQuestions(activeOnly = false): Promise<Question[]> {
  const sql = activeOnly
    ? 'SELECT * FROM questions WHERE is_active = 1 ORDER BY created_at DESC'
    : 'SELECT * FROM questions ORDER BY created_at DESC';
  return db.query<Question>(sql);
}

export async function getQuestionById(id: string): Promise<Question | null> {
  return db.get<Question>('SELECT * FROM questions WHERE id = ?', [id]);
}

export async function createQuestion(
  data: {
    domain?: ChallengeDomain;
    title: string;
    situation: string;
    task: string;
    requirements: string;
    technical_requirements: string;
    submission_guideline?: string;
    category?: string;
    difficulty?: string;
  },
  admin: { id: string; username: string }
): Promise<Question> {
  const id = uuidv4();
  const now = new Date().toISOString();
  const domain = data.domain || 'WEB DEVELOPMENT';
  const title = (data.title || '').trim();
  const situation = (data.situation || '').trim();
  const task = (data.task || '').trim();
  const requirements = (data.requirements || '').trim();
  const technical_requirements = (data.technical_requirements || '').trim();
  const submission_guideline = data.submission_guideline || 'Write one comprehensive prompt that you would give to an AI coding agent.';
  const category = data.category || 'Prompt Engineering';
  const difficulty = data.difficulty || 'Medium';

  const combinedText = `### ${title}\n\n**1. Title:** ${title}\n\n**2. Situation:**\n${situation}\n\n**3. Your Task:**\n${task}\n\n**4. Requirements:**\n${requirements}\n\n**5. Technical Requirements:**\n${technical_requirements}\n\n**6. Your Submission:**\n${submission_guideline}`;

  await db.run(
    `INSERT INTO questions (
      id, domain, title, situation, task, requirements, technical_requirements,
      submission_guideline, question_text, category, difficulty, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      domain,
      title,
      situation,
      task,
      requirements,
      technical_requirements,
      submission_guideline,
      combinedText,
      category,
      difficulty,
      1,
      now,
      now,
    ]
  );

  await logAdminAction(admin.id, admin.username, 'CREATE_QUESTION', 'QUESTION', id, `Created: "${title.slice(0, 40)}" in [${domain}]`);

  return (await getQuestionById(id))!;
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
  },
  admin: { id: string; username: string }
): Promise<Question | null> {
  const existing = await getQuestionById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const domain = data.domain !== undefined ? data.domain : (existing.domain || 'WEB DEVELOPMENT');
  const title = data.title !== undefined ? data.title.trim() : (existing.title || '');
  const situation = data.situation !== undefined ? data.situation.trim() : (existing.situation || '');
  const task = data.task !== undefined ? data.task.trim() : (existing.task || '');
  const requirements = data.requirements !== undefined ? data.requirements.trim() : (existing.requirements || '');
  const technical_requirements = data.technical_requirements !== undefined ? data.technical_requirements.trim() : (existing.technical_requirements || '');
  const submission_guideline = data.submission_guideline !== undefined ? data.submission_guideline : (existing.submission_guideline || 'Write one comprehensive prompt that you would give to an AI coding agent.');
  const category = data.category !== undefined ? data.category : existing.category;
  const difficulty = data.difficulty !== undefined ? data.difficulty : existing.difficulty;
  const is_active = data.is_active !== undefined ? (data.is_active ? 1 : 0) : existing.is_active;

  const combinedText = `### ${title}\n\n**1. Title:** ${title}\n\n**2. Situation:**\n${situation}\n\n**3. Your Task:**\n${task}\n\n**4. Requirements:**\n${requirements}\n\n**5. Technical Requirements:**\n${technical_requirements}\n\n**6. Your Submission:**\n${submission_guideline}`;

  await db.run(
    `UPDATE questions SET
      domain = ?, title = ?, situation = ?, task = ?, requirements = ?, technical_requirements = ?,
      submission_guideline = ?, question_text = ?, category = ?, difficulty = ?, is_active = ?, updated_at = ?
     WHERE id = ?`,
    [
      domain,
      title,
      situation,
      task,
      requirements,
      technical_requirements,
      submission_guideline,
      combinedText,
      category,
      difficulty,
      is_active,
      now,
      id,
    ]
  );

  await logAdminAction(admin.id, admin.username, 'UPDATE_QUESTION', 'QUESTION', id, `Updated: "${title.slice(0, 40)}" in [${domain}]`);

  return getQuestionById(id);
}

export async function deleteQuestion(
  id: string,
  admin: { id: string; username: string }
): Promise<boolean> {
  const existing = await getQuestionById(id);
  if (!existing) return false;

  await db.run('DELETE FROM questions WHERE id = ?', [id]);
  await logAdminAction(admin.id, admin.username, 'DELETE_QUESTION', 'QUESTION', id, `Deleted: "${(existing.title || existing.question_text).slice(0, 40)}"`);

  return true;
}

export async function toggleQuestionActive(
  id: string,
  admin: { id: string; username: string }
): Promise<Question | null> {
  const existing = await getQuestionById(id);
  if (!existing) return null;

  const newStatus = existing.is_active ? 0 : 1;
  const now = new Date().toISOString();

  await db.run('UPDATE questions SET is_active = ?, updated_at = ? WHERE id = ?', [newStatus, now, id]);
  await logAdminAction(admin.id, admin.username, 'TOGGLE_QUESTION_STATUS', 'QUESTION', id, `Status changed to: ${newStatus ? 'Active' : 'Inactive'}`);

  return getQuestionById(id);
}
