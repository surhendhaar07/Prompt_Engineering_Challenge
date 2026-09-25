import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'xentrix-2026-super-secret-jwt-key-innovate-inspire-elevate',
  sessionSecret: process.env.SESSION_SECRET || 'xentrix-session-secret-2026',
  corsOrigin: process.env.FRONTEND_URL || 'http://localhost:5173',
  defaultAdminUsername: process.env.ADMIN_DEFAULT_USER || 'admin',
  defaultAdminPassword: process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@XenTriX2026',
  event: {
    symposiumName: "XenTriX'26",
    tagline: "Innovate Inspire Elevate",
    eventName: "Prompt Engineering Challenge",
    defaultDurationMinutes: 30,
  }
};
