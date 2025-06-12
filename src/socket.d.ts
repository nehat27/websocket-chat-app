declare module 'socket.io-client' {
  export interface Socket {
    id: string;
    connected: boolean;
    disconnected: boolean;
    
    connect(): Socket;
    disconnect(): Socket;
    
    emit(event: string, ...args: any[]): Socket;
    
    on(event: string, callback: (...args: any[]) => void): Socket;
    once(event: string, callback: (...args: any[]) => void): Socket;
    off(event?: string, listener?: Function): Socket;
    removeListener(event: string, listener?: Function): Socket;
    removeAllListeners(event?: string): Socket;
    
    // Add any other methods you need from socket.io
  }
  
  export function io(uri: string, opts?: any): Socket;
} 