import { v4 as uuidv4 } from 'uuid';
import * as db from './index';
import { hashPassword } from '../utils/security';
import { config } from '../config';

const SUBMISSION_PROMPT = 'Write one comprehensive prompt that you would give to an AI coding agent.';

const structuredQuestions = [
  // ==========================================
  // DOMAIN 1: WEB DEVELOPMENT
  // ==========================================
  {
    domain: 'WEB DEVELOPMENT',
    category: 'Full-Stack Web Architecture',
    difficulty: 'Hard',
    title: 'Real-Time Collaborative Whiteboard & Kanban Workspace',
    situation: 'A fast-growing engineering organization requires an internal real-time collaborative workspace where distributed teams can brainstorm on an infinite canvas whiteboard, transition diagram nodes directly into actionable Kanban tasks, and synchronize state with ultra-low latency across 50+ concurrent users per room.',
    task: 'Design an exhaustive prompt for an AI coding agent to implement the entire full-stack real-time collaboration application from scratch.',
    requirements: '- Dynamic infinite canvas supporting vector shapes, sticky notes, connectors, and text blocks.\n- Drag-and-drop Kanban task board with swimlanes, custom labels, and drag animations.\n- One-click transformation of canvas diagram items into Kanban board cards.\n- Multiplayer presence showing real-time live cursors, participant avatars, and activity indicators.',
    technical_requirements: '- Frontend: React, TypeScript, HTML5 Canvas / SVG rendering, Tailwind CSS, Lucide icons.\n- Real-Time & Backend: Node.js, Express, Socket.IO / WebSockets with operational transformation or CRDT conflict resolution.\n- State & Persistence: PostgreSQL / SQLite with schema for boards, cards, nodes, and room sessions.\n- Performance: 60 FPS canvas panning/zooming, debounced batch synchronization, and automatic offline reconnect handling.',
    submission_guideline: SUBMISSION_PROMPT,
  },
  {
    domain: 'WEB DEVELOPMENT',
    category: 'Enterprise UI & RBAC',
    difficulty: 'Medium',
    title: 'Multi-Tenant SaaS Analytics Dashboard with Dynamic Theming & RBAC',
    situation: 'An enterprise B2B platform is launching a multi-tenant administration suite where distinct corporate clients manage multiple sub-organizations with varying role permissions (Super Admin, Organization Manager, Analyst, Auditor) and customized brand themes.',
    task: 'Create a master prompt that instructs an AI coding agent to generate the complete multi-tenant dashboard and RBAC authorization engine.',
    requirements: '- Tenant onboarding with custom sub-domain routing, dynamic CSS color variable theming, and logo uploads.\n- Granular Role-Based Access Control (RBAC) with customizable permission matrices and audit trails.\n- Interactive telemetry analytics charts: revenue MRR, active users, error rates, and API throughput.\n- Data export engine generating CSV and printable PDF reports.',
    technical_requirements: '- Frontend: React 18, TypeScript, Tailwind CSS with CSS variable theming, Recharts / Chart.js.\n- Backend: Express.js, TypeScript, JWT auth with tenant ID tenant isolation middleware.\n- Database: Relational schema enforcing foreign key tenant isolation on all tables.\n- Security: Protection against IDOR (Insecure Direct Object References) and XSS vulnerability prevention.',
    submission_guideline: SUBMISSION_PROMPT,
  },
  {
    domain: 'WEB DEVELOPMENT',
    category: 'Progressive Web Apps (PWA)',
    difficulty: 'Medium',
    title: 'Offline-First Progressive Web App for Field Logistics & Inspection',
    situation: 'Field technicians inspect industrial energy equipment in remote environments with zero or intermittent internet connectivity. They need a responsive web app to fill multi-step inspection forms, capture sensor photos, record GPS coordinates, and automatically reconcile conflicts when reconnected.',
    task: 'Develop a comprehensive prompt for an AI coding assistant to construct an offline-first PWA with background sync and IndexedDB local caching.',
    requirements: '- Full PWA installation manifest, service worker registration, and offline asset caching.\n- Multi-step inspection form with dynamic validation, photo attachment preview, and signature capture canvas.\n- Offline queue manager with visual sync badge (Synced, Pending, Failed, Conflict).\n- Conflict resolution modal allowing technicians to compare local vs server edits.',
    technical_requirements: '- Storage: IndexedDB via Dexie.js / native IDB for offline mutation queuing.\n- Sync: Background Sync API + fallback polling when online event triggers.\n- Framework: React, TypeScript, Tailwind CSS, Service Workers.\n- Reliability: Zero data loss guarantee during unexpected browser closures or reloads.',
    submission_guideline: SUBMISSION_PROMPT,
  },
  {
    domain: 'WEB DEVELOPMENT',
    category: 'Micro-Frontend & Real-Time',
    difficulty: 'Hard',
    title: 'High-Frequency FinTech Trading Terminal & Order Book Viewer',
    situation: 'A fintech startup needs an ultra-responsive web trading dashboard that renders live WebSocket market order book streams (L2 data), candlestick charts, and instant trade execution controls with sub-100ms UI responsiveness.',
    task: 'Formulate an in-depth prompt for an AI developer agent to engineer the high-performance trading dashboard interface.',
    requirements: '- Real-time animated L2 Order Book with visual depth bars showing buy/sell volume distribution.\n- Interactive Candlestick price chart with timeframe selectors (1m, 5m, 1h, 1D) and technical indicators (SMA, RSI).\n- Order placement widget supporting Market, Limit, and Stop-Loss orders with margin calculation.\n- Live trade history stream with instant audio/visual execution cues.',
    technical_requirements: '- Performance: Virtualized lists for trade stream to eliminate DOM thrashing, requestAnimationFrame chart rendering.\n- WebSocket: Binary / JSON streaming with automatic heartbeat and reconnection backoff.\n- State Management: Optimized React state with minimal re-render boundaries.\n- Styling: Dark cyber-fintech theme with green/red buy-sell color tokens and high visual hierarchy.',
    submission_guideline: SUBMISSION_PROMPT,
  },

  // ==========================================
  // DOMAIN 2: GEN AI APPLICATION
  // ==========================================
  {
    domain: 'GEN AI APPLICATION',
    category: 'RAG & Document Intelligence',
    difficulty: 'Hard',
    title: 'Production RAG System with Citation Grounding & Hallucination Guardrails',
    situation: 'A legal-tech enterprise needs an automated Retrieval-Augmented Generation (RAG) assistant that indexes thousands of complex contracts, legal filings, and compliance statutes. The assistant must answer high-stakes compliance queries with mandatory exact-source citations `[Doc: Page/Line]` and strictly reject answering queries outside provided context.',
    task: 'Construct a master prompt for an AI agent to build the full-stack RAG application with embedding ingestion, vector search, and citation verification.',
    requirements: '- Document ingestion pipeline supporting PDF, DOCX, and Markdown with recursive chunking and metadata preservation.\n- Hybrid Search retriever combining semantic vector similarity (Cosine/Dot) with BM25 keyword search.\n- Chat interface with interactive inline citation tooltips that highlight the original document excerpt.\n- Strict Anti-Hallucination Guardrail: System prompt that flags ungrounded claims and generates confidence scores.',
    technical_requirements: '- Embeddings & Vector DB: PGVector (PostgreSQL) or ChromaDB with OpenAI / Cohere embeddings.\n- LLM Orchestration: LangChain / LlamaIndex or native OpenAI API function calling.\n- Full Stack: React frontend with streaming text responses (SSE), Node.js backend with chunking worker.\n- Evaluation: Outputting structured verification metadata for each retrieved citation.',
    submission_guideline: SUBMISSION_PROMPT,
  },
  {
    domain: 'GEN AI APPLICATION',
    category: 'Autonomous Multi-Agent Systems',
    difficulty: 'Hard',
    title: 'Multi-Agent Code Security Audit & Automated Fix Pull Request Swarm',
    situation: 'An open-source security foundation requires an autonomous multi-agent AI system that ingests GitHub repositories, scans code for OWASP Top 10 vulnerabilities, performs adversarial red-team exploit simulation, and generates verified secure patch pull requests.',
    task: 'Design a comprehensive system prompt for an AI coding agent to implement the multi-agent security orchestrator.',
    requirements: '- Orchestration of 3 specialized agent personas: (1) Vulnerability Scanner, (2) Red-Team Exploit Validator, (3) Secure Patch Engineer.\n- ReAct (Reasoning + Action) execution loop with step-by-step thinking logs and tool invocations.\n- Automated generation of reproducible unit test cases demonstrating the vulnerability before and after fix.\n- Interactive Web Dashboard visualizing the agent swarm debate, AST code diffs, and severity scores.',
    technical_requirements: '- Agent Framework: State graph architecture (e.g. LangGraph / AutoGen / CrewAI pattern).\n- Tools: AST code parser, regex sanitizer, containerized sandbox runner for test execution.\n- Frontend: React + TypeScript dashboard with live agent stream nodes and interactive side-by-side git diff viewer.\n- Backend: Express / FastAPI with asynchronous agent job queue.',
    submission_guideline: SUBMISSION_PROMPT,
  },
  {
    domain: 'GEN AI APPLICATION',
    category: 'Conversational AI & Prompt Defense',
    difficulty: 'Medium',
    title: 'Jailbreak-Resistant Enterprise Customer Service Voice & Chat Agent',
    situation: 'A multinational banking conglomerate is deploying an AI Customer Banking Assistant. The assistant has access to internal balance lookup and wire transfer APIs, but is constantly targeted by adversarial prompt injections, DAN jailbreaks, base64 bypasses, and social engineering attacks.',
    task: 'Write an exhaustive prompt for an AI developer to build the fortified AI banking assistant and its defense proxy layer.',
    requirements: '- Multi-layer defensive prompt wrapper with input sanitization, delimiter isolation, and canary token validation.\n- Function Calling / Tool Calling integration for `checkBalance`, `getTransactions`, `initiateTransfer` with mandatory double-confirmation checks for high-value operations.\n- Strict Policy Boundaries: Refusal protocol for role-reversal attacks, developer mode requests, or policy override attempts.\n- Real-time Safety Monitor Dashboard displaying threat telemetry, blocked injection patterns, and conversation safety flags.',
    technical_requirements: '- Frontend: Cyber-styled banking chat UI with voice input (Web Speech API) and tool execution cards.\n- Backend: Node.js / Express security proxy executing regex pre-filters and dual-pass LLM moderation.\n- State & Session: Encrypted session store with rate-limiting and anomaly detection.\n- Resilience: Zero leakage of system prompt or internal instructions under any adversarial scenario.',
    submission_guideline: SUBMISSION_PROMPT,
  },
  {
    domain: 'GEN AI APPLICATION',
    category: 'NL-to-Code & Schema Graph Copilot',
    difficulty: 'Medium',
    title: 'Self-Correcting Natural Language to SQL Analytics Copilot',
    situation: 'A business intelligence software company wants a natural language analytics copilot that enables non-technical business analysts to query massive enterprise databases by typing plain English questions, with automatic SQL synthesis, syntax self-correction, and interactive chart visualization.',
    task: 'Develop a comprehensive prompt for an AI coding assistant to create the full self-healing NL-to-SQL copilot application.',
    requirements: '- Schema Graph Extractor that dynamically reads database tables, columns, foreign keys, and column value sample hints.\n- Few-Shot SQL generator prompt with Dialect-specific optimization (PostgreSQL / MySQL) and NULL-safety.\n- Self-Healing Execution Loop: If database returns a SQL syntax/type error, AI agent automatically diagnoses the error message, refactors the query, and re-executes.\n- Automatic data visualization selector that chooses the best chart type (Bar, Line, Pie, Metric Card) based on SQL result shapes.',
    technical_requirements: '- Security Guardrails: Hard blocking of DROP, DELETE, UPDATE, ALTER, TRUNCATE, and grant operations via AST SQL parser.\n- Frontend: React, Tailwind CSS, Monaco code editor with SQL syntax highlighting, Recharts dynamic visualizer.\n- Backend: Node.js API with read-only database connection pool and execution timeout limiter.\n- Output: Clean structured response including SQL query, explanation, data table, and rendered chart.',
    submission_guideline: SUBMISSION_PROMPT,
  },
];

const defaultTeams = [
  { name: 'TEAM_ALPHA', pass: 'xen_alpha_26', num: 'XT-01', domain: 'WEB DEVELOPMENT' },
  { name: 'TEAM_BETA', pass: 'xen_beta_26', num: 'XT-02', domain: 'GEN AI APPLICATION' },
  { name: 'TEAM_GAMMA', pass: 'xen_gamma_26', num: 'XT-03', domain: 'WEB DEVELOPMENT' },
  { name: 'TEAM_DELTA', pass: 'xen_delta_26', num: 'XT-04', domain: 'GEN AI APPLICATION' },
  { name: 'TEAM_OMEGA', pass: 'xen_omega_26', num: 'XT-05', domain: 'WEB DEVELOPMENT' },
  { name: 'TEAM_CYBER', pass: 'xen_cyber_26', num: 'XT-06', domain: 'GEN AI APPLICATION' },
  { name: 'TEAM_NEXUS', pass: 'xen_nexus_26', num: 'XT-07', domain: 'WEB DEVELOPMENT' },
  { name: 'TEAM_VERTEX', pass: 'xen_vertex_26', num: 'XT-08', domain: 'GEN AI APPLICATION' },
];

const defaultSettings = [
  { key: 'challenge_duration_minutes', value: '30' },
  { key: 'active_questions_count', value: '10' },
  { key: 'random_assignment_enabled', value: 'true' },
  { key: 'unique_questions_enabled', value: 'true' },
  { key: 'copy_paste_monitoring_enabled', value: 'true' },
  { key: 'tab_switch_monitoring_enabled', value: 'true' },
  { key: 'fullscreen_monitoring_enabled', value: 'true' },
  { key: 'right_click_prevention_enabled', value: 'true' },
  { key: 'allow_manual_reassign', value: 'true' },
];

export async function seedDatabase(): Promise<void> {
  const now = new Date().toISOString();

  // 1. Seed System Settings
  for (const s of defaultSettings) {
    const existing = await db.get('SELECT key FROM system_settings WHERE key = ?', [s.key]);
    if (!existing) {
      await db.run('INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)', [
        s.key,
        s.value,
        now,
      ]);
    }
  }

  // 2. Seed Admin User
  const existingAdmin = await db.get('SELECT id FROM users WHERE username = ?', [config.defaultAdminUsername]);
  if (!existingAdmin) {
    const adminId = uuidv4();
    const adminHash = await hashPassword(config.defaultAdminPassword);
    await db.run(
      'INSERT INTO users (id, username, password_hash, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [adminId, config.defaultAdminUsername, adminHash, 'admin', 1, now, now]
    );
    console.log(`[Seed] Created Default Admin: ${config.defaultAdminUsername} / ${config.defaultAdminPassword}`);
  }

  // 3. Clear & Re-Seed Questions with 6 Structured Parts & Domains
  const existingQuestions = await db.query('SELECT id, title FROM questions');
  const hasOldFormat = existingQuestions.some((q) => !q.title);
  if (existingQuestions.length === 0 || hasOldFormat) {
    await db.run('DELETE FROM questions');
    for (const q of structuredQuestions) {
      const qId = uuidv4();
      const combinedText = `### ${q.title}\n\n**1. Title:** ${q.title}\n\n**2. Situation:**\n${q.situation}\n\n**3. Your Task:**\n${q.task}\n\n**4. Requirements:**\n${q.requirements}\n\n**5. Technical Requirements:**\n${q.technical_requirements}\n\n**6. Your Submission:**\n${q.submission_guideline}`;

      await db.run(
        `INSERT INTO questions (
          id, domain, title, situation, task, requirements, technical_requirements,
          submission_guideline, question_text, category, difficulty, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          qId,
          q.domain,
          q.title,
          q.situation,
          q.task,
          q.requirements,
          q.technical_requirements,
          q.submission_guideline,
          combinedText,
          q.category,
          q.difficulty,
          1,
          now,
          now,
        ]
      );
    }
    console.log(`[Seed] Seeded ${structuredQuestions.length} 6-part questions across WEB DEVELOPMENT and GEN AI APPLICATION domains.`);
  }

  // 4. Seed Default Teams with Domains
  for (const t of defaultTeams) {
    const existingUser = await db.get('SELECT id FROM users WHERE username = ?', [t.name]);
    if (!existingUser) {
      const userId = uuidv4();
      const teamId = uuidv4();
      const passHash = await hashPassword(t.pass);

      await db.run(
        'INSERT INTO users (id, username, password_hash, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, t.name, passHash, 'participant', 1, now, now]
      );

      await db.run(
        'INSERT INTO teams (id, user_id, team_name, team_number, domain, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [teamId, userId, t.name, t.num, t.domain, 1, now, now]
      );
    } else {
      // Ensure domain is set
      await db.run('UPDATE teams SET domain = ? WHERE team_name = ? AND (domain IS NULL OR domain = "")', [t.domain, t.name]);
    }
  }
}

// Auto-run when executed directly via CLI
if (require.main === module || process.argv[1]?.includes('seed.ts') || process.argv[1]?.includes('seed')) {
  (async () => {
    try {
      await db.initDatabase();
      await seedDatabase();
      console.log('[Seed] Database initialization and seeding complete.');
      process.exit(0);
    } catch (err) {
      console.error('[Seed] Error seeding database:', err);
      process.exit(1);
    }
  })();
}

