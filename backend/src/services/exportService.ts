import * as db from '../db';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import PDFDocument from 'pdfkit';

interface FullSubmissionData {
  team_name: string;
  team_number: string;
  team_domain: string;
  question_title: string;
  question_domain: string;
  question_situation: string;
  question_task: string;
  question_requirements: string;
  question_technical_requirements: string;
  question_submission_guideline: string;
  question_text: string;
  answer: string;
  started_at: string;
  submitted_at: string;
  duration_used_seconds: number;
  submission_type: string;
  tab_switch_count: number;
  fullscreen_exit_count: number;
  copy_attempt_count: number;
  paste_attempt_count: number;
  status: string;
}

async function getSubmissionsData(): Promise<FullSubmissionData[]> {
  const sql = `
    SELECT 
      t.team_name,
      COALESCE(t.team_number, 'N/A') as team_number,
      COALESCE(t.domain, 'WEB DEVELOPMENT') as team_domain,
      COALESCE(q.title, 'Prompt Challenge') as question_title,
      COALESCE(q.domain, 'WEB DEVELOPMENT') as question_domain,
      COALESCE(q.situation, '') as question_situation,
      COALESCE(q.task, '') as question_task,
      COALESCE(q.requirements, '') as question_requirements,
      COALESCE(q.technical_requirements, '') as question_technical_requirements,
      COALESCE(q.submission_guideline, 'Write one comprehensive prompt that you would give to an AI coding agent.') as question_submission_guideline,
      q.question_text,
      s.answer,
      s.started_at,
      s.submitted_at,
      s.duration_used_seconds,
      s.submission_type,
      s.tab_switch_count,
      s.fullscreen_exit_count,
      s.copy_attempt_count,
      s.paste_attempt_count,
      s.status
    FROM submissions s
    JOIN teams t ON s.team_id = t.id
    JOIN questions q ON s.question_id = q.id
    ORDER BY s.submitted_at DESC
  `;

  return db.query<FullSubmissionData>(sql);
}

// 1. Export Excel (.xlsx)
export async function generateExcelBuffer(): Promise<Buffer> {
  const rows = await getSubmissionsData();

  const summaryData = rows.map((r, idx) => {
    const mins = Math.floor((r.duration_used_seconds || 0) / 60);
    const secs = (r.duration_used_seconds || 0) % 60;
    const formattedDuration = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const wordCount = (r.answer || '').trim().split(/\s+/).filter(Boolean).length;

    return {
      'S.No': idx + 1,
      'Team Name': r.team_name,
      'Team Number': r.team_number,
      'Domain': r.team_domain,
      'Question Title': r.question_title,
      'Submission Type': r.submission_type,
      'Duration Used': formattedDuration,
      'Duration (Sec)': r.duration_used_seconds,
      'Word Count': wordCount,
      'Tab Switches': r.tab_switch_count || 0,
      'Fullscreen Exits': r.fullscreen_exit_count || 0,
      'Submitted At': new Date(r.submitted_at).toLocaleString(),
      'Status': r.status,
    };
  });

  const detailedData = rows.map((r) => ({
    'Team Name': r.team_name,
    'Domain': r.team_domain,
    'Question Title': r.question_title,
    'Question Situation': r.question_situation,
    'Question Task': r.question_task,
    'Functional Requirements': r.question_requirements,
    'Technical Requirements': r.question_technical_requirements,
    'Submission Directive': r.question_submission_guideline,
    'Full Question Text': r.question_text,
    'Submitted Prompt Solution': r.answer,
    'Submitted At': r.submitted_at,
  }));

  const workbook = XLSX.utils.book_new();

  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  const wsDetailed = XLSX.utils.json_to_sheet(detailedData);

  XLSX.utils.book_append_sheet(workbook, wsSummary, 'Contest Summary');
  XLSX.utils.book_append_sheet(workbook, wsDetailed, 'Submissions & Questions');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

// 2. Export Word Document (.docx)
export async function generateWordBuffer(): Promise<Buffer> {
  const rows = await getSubmissionsData();

  const docChildren: any[] = [
    new Paragraph({
      text: "XenTriX'26 - Prompt Engineering Challenge",
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Official Submission & Evaluation Dossier", bold: true, size: 24 }),
        new TextRun({ text: `\nGenerated on: ${new Date().toLocaleString()}`, italics: true }),
        new TextRun({ text: `\nTotal Submissions Evaluated: ${rows.length}`, bold: true }),
      ],
      spacing: { after: 300 },
    }),
  ];

  if (rows.length === 0) {
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: "No team submissions recorded yet.", italics: true }),
        ],
      })
    );
  }

  rows.forEach((r, idx) => {
    const mins = Math.floor((r.duration_used_seconds || 0) / 60);
    const secs = (r.duration_used_seconds || 0) % 60;
    const formattedDuration = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const wordCount = (r.answer || '').trim().split(/\s+/).filter(Boolean).length;

    docChildren.push(
      new Paragraph({
        text: `Team ${idx + 1}: ${r.team_name} [${r.team_domain}]`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `Team ID: `, bold: true }),
          new TextRun({ text: `${r.team_number} | ` }),
          new TextRun({ text: `Submission Type: `, bold: true }),
          new TextRun({ text: `${r.submission_type} | ` }),
          new TextRun({ text: `Duration Used: `, bold: true }),
          new TextRun({ text: `${formattedDuration} (${r.duration_used_seconds}s) | ` }),
          new TextRun({ text: `Word Count: `, bold: true }),
          new TextRun({ text: `${wordCount} words` }),
        ],
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `Proctoring Metrics: `, bold: true }),
          new TextRun({ text: `Tab Switches: ${r.tab_switch_count || 0} | Fullscreen Exits: ${r.fullscreen_exit_count || 0} | Copy Attempts: ${r.copy_attempt_count || 0} | Paste Attempts: ${r.paste_attempt_count || 0}` }),
        ],
        spacing: { after: 150 },
      }),
      new Paragraph({
        text: `--- ASSIGNED QUESTION (6 PARTS) ---`,
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 100, after: 80 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `1. Title: `, bold: true }),
          new TextRun({ text: r.question_title }),
        ],
        spacing: { after: 60 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `2. Situation: `, bold: true }),
          new TextRun({ text: r.question_situation }),
        ],
        spacing: { after: 60 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `3. Your Task: `, bold: true }),
          new TextRun({ text: r.question_task }),
        ],
        spacing: { after: 60 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `4. Requirements: `, bold: true }),
          new TextRun({ text: r.question_requirements }),
        ],
        spacing: { after: 60 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `5. Technical Requirements: `, bold: true }),
          new TextRun({ text: r.question_technical_requirements }),
        ],
        spacing: { after: 60 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `6. Your Submission: `, bold: true }),
          new TextRun({ text: r.question_submission_guideline }),
        ],
        spacing: { after: 150 },
      }),
      new Paragraph({
        text: `--- SUBMITTED PROMPT SOLUTION ---`,
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 100, after: 80 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: r.answer || "(No answer recorded)",
            font: "Courier New",
          }),
        ],
        spacing: { after: 300 },
      })
    );
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docChildren,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

// 3. Export PDF Document (.pdf)
export async function generatePDFBuffer(): Promise<Buffer> {
  const rows = await getSubmissionsData();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Title Header
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#0284c7').text("XenTriX'26 Technical Symposium", { align: 'center' });
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e293b').text("Prompt Engineering Challenge - Results Dossier", { align: 'center' });
    doc.fontSize(9).font('Helvetica-Oblique').fillColor('#64748b').text(`Report Generated: ${new Date().toLocaleString()} | Total Teams: ${rows.length}`, { align: 'center' });
    doc.moveDown(1.5);

    if (rows.length === 0) {
      doc.fontSize(12).font('Helvetica').fillColor('#475569').text("No submissions have been recorded yet.", { align: 'center' });
    }

    rows.forEach((r, idx) => {
      if (idx > 0) {
        doc.addPage();
      }

      const mins = Math.floor((r.duration_used_seconds || 0) / 60);
      const secs = (r.duration_used_seconds || 0) % 60;
      const formattedDuration = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      const wordCount = (r.answer || '').trim().split(/\s+/).filter(Boolean).length;

      // Team Header Box
      doc.rect(40, doc.y, 515, 60).fillAndStroke('#f1f5f9', '#0284c7');
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(14).text(`Team ${idx + 1}: ${r.team_name}`, 50, doc.y - 50);
      doc.fontSize(9).font('Helvetica').fillColor('#334155').text(`Domain: ${r.team_domain} | Team ID: ${r.team_number} | Type: ${r.submission_type} | Duration: ${formattedDuration} (${wordCount} words)`, 50, doc.y + 2);
      doc.fontSize(8).fillColor('#b91c1c').text(`Violations: Tab Switches: ${r.tab_switch_count || 0} | Fullscreen Exits: ${r.fullscreen_exit_count || 0} | Copy/Paste: ${(r.copy_attempt_count || 0) + (r.paste_attempt_count || 0)}`, 50, doc.y + 2);

      doc.moveDown(2.5);

      // Question 6 Parts Box
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#0284c7').text("1. Title & Scenario Overview:");
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#0f172a').text(r.question_title);
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#0369a1').text("2. Situation:");
      doc.fontSize(8.5).font('Helvetica').fillColor('#1e293b').text(r.question_situation);
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#0369a1').text("3. Your Task:");
      doc.fontSize(8.5).font('Helvetica').fillColor('#1e293b').text(r.question_task);
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#0369a1').text("4. Functional Requirements:");
      doc.fontSize(8.5).font('Helvetica').fillColor('#1e293b').text(r.question_requirements);
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#0369a1').text("5. Technical Requirements:");
      doc.fontSize(8.5).font('Helvetica').fillColor('#1e293b').text(r.question_technical_requirements);
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#0369a1').text("6. Submission Guideline:");
      doc.fontSize(8.5).font('Helvetica-Oblique').fillColor('#475569').text(r.question_submission_guideline);
      doc.moveDown(1);

      // Submitted Prompt Box
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#059669').text("Submitted Prompt Solution:");
      doc.moveDown(0.3);
      doc.rect(40, doc.y, 515, Math.min(220, doc.page.height - doc.y - 50)).fillAndStroke('#f8fafc', '#10b981');
      doc.font('Courier').fontSize(8).fillColor('#0f172a').text(
        r.answer || "(No answer submitted)",
        48,
        doc.y - (Math.min(220, doc.page.height - doc.y - 50)) + 8,
        { width: 500, height: 200, ellipsis: true }
      );
    });

    doc.end();
  });
}

// 4. Export CSV
export async function generateResultsCSV(): Promise<string> {
  const rows = await getSubmissionsData();

  const headers = [
    'Team Name',
    'Team Number',
    'Domain',
    'Question Title',
    'Question Situation',
    'Question Task',
    'Functional Requirements',
    'Technical Requirements',
    'Submission Directive',
    'Submitted Prompt',
    'Start Time',
    'Submit Time',
    'Duration Used (Seconds)',
    'Duration Formatted (MM:SS)',
    'Submission Type',
    'Tab Switch Count',
    'Fullscreen Exit Count',
    'Copy Attempts',
    'Paste Attempts',
    'Status'
  ];

  const escapeCSV = (field: any) => {
    if (field === null || field === undefined) return '""';
    const str = String(field).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvLines: string[] = [];
  csvLines.push(headers.map(escapeCSV).join(','));

  for (const row of rows) {
    const mins = Math.floor((row.duration_used_seconds || 0) / 60);
    const secs = (row.duration_used_seconds || 0) % 60;
    const formattedDuration = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const line = [
      escapeCSV(row.team_name),
      escapeCSV(row.team_number || ''),
      escapeCSV(row.team_domain || 'WEB DEVELOPMENT'),
      escapeCSV(row.question_title),
      escapeCSV(row.question_situation),
      escapeCSV(row.question_task),
      escapeCSV(row.question_requirements),
      escapeCSV(row.question_technical_requirements),
      escapeCSV(row.question_submission_guideline),
      escapeCSV(row.answer),
      escapeCSV(row.started_at),
      escapeCSV(row.submitted_at),
      escapeCSV(row.duration_used_seconds),
      escapeCSV(formattedDuration),
      escapeCSV(row.submission_type),
      escapeCSV(row.tab_switch_count || 0),
      escapeCSV(row.fullscreen_exit_count || 0),
      escapeCSV(row.copy_attempt_count || 0),
      escapeCSV(row.paste_attempt_count || 0),
      escapeCSV(row.status),
    ];
    csvLines.push(line.join(','));
  }

  return csvLines.join('\r\n');
}
