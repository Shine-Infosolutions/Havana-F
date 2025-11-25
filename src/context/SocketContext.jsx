import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    return { socket: null };
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    try {
      const newSocket = io(process.env.VITE_API_BASE_URL || 'http://localhost:5000');
      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } catch (error) {
      console.log('Socket connection failed:', error);
    }
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;