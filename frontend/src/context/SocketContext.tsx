import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { ActivityLog } from '../types';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineCount: number;
  latestAlert: ActivityLog | null;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onlineCount: 0,
  latestAlert: null,
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [latestAlert, setLatestAlert] = useState<ActivityLog | null>(null);

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketInstance = io(window.location.origin, {
      auth: { token },
      query: { token },
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      if (user?.role === 'admin') {
        socketInstance.emit('join:admin', { token });
      } else if (user?.role === 'participant' && user.teamId) {
        socketInstance.emit('join:team', { token });
      }
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('stats:online_count', (data: { onlineCount: number }) => {
      setOnlineCount(data.onlineCount);
    });

    socketInstance.on('activity:alert', (alert: ActivityLog) => {
      setLatestAlert(alert);
    });

    setSocket(socketInstance);

    // Heartbeat / telemetry ping every 25 seconds
    const interval = setInterval(() => {
      if (socketInstance.connected && user?.teamId) {
        socketInstance.emit('activity:ping', { teamId: user.teamId });
      }
    }, 25000);

    return () => {
      clearInterval(interval);
      socketInstance.disconnect();
    };
  }, [token, user?.role, user?.teamId]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineCount, latestAlert }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
