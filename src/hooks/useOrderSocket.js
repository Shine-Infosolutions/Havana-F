import { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';

export const useOrderSocket = ({ onNewOrder, onOrderStatusUpdate, showNotifications = true }) => {
  const { socket } = useSocket();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    if (onNewOrder) {
      socket.on('new-order', onNewOrder);
    }

    if (onOrderStatusUpdate) {
      socket.on('order-status-update', onOrderStatusUpdate);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      if (onNewOrder) socket.off('new-order', onNewOrder);
      if (onOrderStatusUpdate) socket.off('order-status-update', onOrderStatusUpdate);
    };
  }, [socket, onNewOrder, onOrderStatusUpdate]);

  return { isConnected };
};

export const useKitchenSocket = ({ onNewKOT, onNewOrder, onKOTStatusUpdate, onKOTItemUpdate, showNotifications = true }) => {
  const { socket } = useSocket();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    if (onNewKOT) socket.on('new-kot', onNewKOT);
    if (onNewOrder) socket.on('new-order', onNewOrder);
    if (onKOTStatusUpdate) socket.on('kot-status-update', onKOTStatusUpdate);
    if (onKOTItemUpdate) socket.on('kot-item-update', onKOTItemUpdate);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      if (onNewKOT) socket.off('new-kot', onNewKOT);
      if (onNewOrder) socket.off('new-order', onNewOrder);
      if (onKOTStatusUpdate) socket.off('kot-status-update', onKOTStatusUpdate);
      if (onKOTItemUpdate) socket.off('kot-item-update', onKOTItemUpdate);
    };
  }, [socket, onNewKOT, onNewOrder, onKOTStatusUpdate, onKOTItemUpdate]);

  return { isConnected };
};