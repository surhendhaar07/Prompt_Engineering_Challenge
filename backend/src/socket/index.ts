import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyToken } from '../utils/security';
import { config } from '../config';

let io: SocketIOServer | null = null;
const onlineTeams = new Map<string, { socketId: string; teamName: string; lastSeen: number }>();
const onlineAdmins = new Set<string>();

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    // Optional token auth on handshake
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    let authUser: any = null;
    if (typeof token === 'string') {
      authUser = verifyToken(token);
    }

    if (authUser) {
      if (authUser.role === 'admin') {
        socket.join('admin-room');
        onlineAdmins.add(socket.id);
        socket.emit('auth:success', { role: 'admin', username: authUser.username });
        emitAdminStatsUpdate();
      } else if (authUser.role === 'participant' && authUser.teamId) {
        socket.join(`team-${authUser.teamId}`);
        onlineTeams.set(authUser.teamId, {
          socketId: socket.id,
          teamName: authUser.teamName || authUser.username,
          lastSeen: Date.now(),
        });
        socket.emit('auth:success', { role: 'participant', teamId: authUser.teamId, teamName: authUser.teamName });
        emitToAdmins('team:online', {
          teamId: authUser.teamId,
          teamName: authUser.teamName,
          timestamp: new Date().toISOString(),
        });
        emitAdminStatsUpdate();
      }
    }

    socket.on('join:admin', (data: { token: string }) => {
      const payload = verifyToken(data.token);
      if (payload && payload.role === 'admin') {
        socket.join('admin-room');
        onlineAdmins.add(socket.id);
        socket.emit('admin:joined', { success: true });
        emitAdminStatsUpdate();
      }
    });

    socket.on('join:team', (data: { token: string }) => {
      const payload = verifyToken(data.token);
      if (payload && payload.role === 'participant' && payload.teamId) {
        socket.join(`team-${payload.teamId}`);
        onlineTeams.set(payload.teamId, {
          socketId: socket.id,
          teamName: payload.teamName || payload.username,
          lastSeen: Date.now(),
        });
        emitToAdmins('team:online', {
          teamId: payload.teamId,
          teamName: payload.teamName,
          timestamp: new Date().toISOString(),
        });
        emitAdminStatsUpdate();
      }
    });

    socket.on('activity:ping', (data: { teamId: string }) => {
      if (data.teamId && onlineTeams.has(data.teamId)) {
        const teamInfo = onlineTeams.get(data.teamId)!;
        teamInfo.lastSeen = Date.now();
      }
    });

    socket.on('disconnect', () => {
      onlineAdmins.delete(socket.id);

      // Check if disconnected socket belongs to any team
      let disconnectedTeamId: string | null = null;
      let disconnectedTeamName = '';

      for (const [teamId, info] of onlineTeams.entries()) {
        if (info.socketId === socket.id) {
          disconnectedTeamId = teamId;
          disconnectedTeamName = info.teamName;
          onlineTeams.delete(teamId);
          break;
        }
      }

      if (disconnectedTeamId) {
        emitToAdmins('team:offline', {
          teamId: disconnectedTeamId,
          teamName: disconnectedTeamName,
          timestamp: new Date().toISOString(),
        });
        emitAdminStatsUpdate();
      }
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function emitToAdmins(event: string, data: any): void {
  if (io) {
    io.to('admin-room').emit(event, data);
  }
}

export function emitToTeam(teamId: string, event: string, data: any): void {
  if (io) {
    io.to(`team-${teamId}`).emit(event, data);
  }
}

export function broadcastAll(event: string, data: any): void {
  if (io) {
    io.emit(event, data);
  }
}

export function getOnlineTeamIds(): string[] {
  return Array.from(onlineTeams.keys());
}

export function isTeamOnline(teamId: string): boolean {
  return onlineTeams.has(teamId);
}

export function emitAdminStatsUpdate(): void {
  if (io) {
    io.to('admin-room').emit('stats:online_count', {
      onlineCount: onlineTeams.size,
      onlineTeamIds: Array.from(onlineTeams.keys()),
    });
  }
}
