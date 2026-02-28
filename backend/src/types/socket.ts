// backend/src/types/socket.ts
import { Server } from 'socket.io';

declare module '../socket' {
  export function setupSocket(server: any): Server;
  export function getOnlineCount(): number;
  export function getOnlineUsersList(): Array<{ userId: string; login: string }>;
  export function isUserOnline(userId: string): boolean;
  export function disconnectUser(userId: string): boolean;
  export function sendToUser(userId: string, event: string, data: any): boolean;
  export function broadcastToAll(event: string, data: any): void;
  export function getSocketStats(): {
    totalConnections: number;
    users: string[];
    timestamp: string;
  };
}