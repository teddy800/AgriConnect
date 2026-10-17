/**
 * WebSocket Hook for Real-Time Updates
 * Provides connection management and event subscriptions
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:4000';

export function useWebSocket() {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const eventHandlersRef = useRef(new Map());

  // Initialize WebSocket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token found');
      return;
    }

    // Create socket connection
    const socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('✅ WebSocket connected:', socket.id);
      setIsConnected(true);
      setError(null);
    });

    socket.on('connected', (data) => {
      console.log('WebSocket welcome:', data.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err.message);
      setError(err.message);
      setIsConnected(false);
    });

    socket.on('error', (err) => {
      console.error('WebSocket error:', err);
      setError(err.message || 'WebSocket error');
    });

    // Cleanup on unmount
    return () => {
      console.log('🔌 Disconnecting WebSocket');
      socket.disconnect();
    };
  }, []);

  // Subscribe to price updates for specific crops
  const subscribeToPrices = useCallback((cropIds, callback) => {
    if (!socketRef.current || !isConnected) {
      console.warn('Cannot subscribe: socket not connected');
      return () => {};
    }

    const socket = socketRef.current;

    // Send subscription request
    socket.emit('subscribe:prices', { cropIds });

    // Listen for price updates
    const handler = (data) => {
      callback(data);
    };
    socket.on('price:update', handler);
    eventHandlersRef.current.set('price:update', handler);

    // Return unsubscribe function
    return () => {
      socket.emit('unsubscribe:prices', { cropIds });
      socket.off('price:update', handler);
      eventHandlersRef.current.delete('price:update');
    };
  }, [isConnected]);

  // Subscribe to marketplace updates (new listings)
  const subscribeToMarketplace = useCallback((filters, callback) => {
    if (!socketRef.current || !isConnected) {
      console.warn('Cannot subscribe: socket not connected');
      return () => {};
    }

    const socket = socketRef.current;

    // Send subscription request
    socket.emit('subscribe:marketplace', filters);

    // Listen for new listings
    const handler = (data) => {
      callback(data);
    };
    socket.on('listing:new', handler);
    eventHandlersRef.current.set('listing:new', handler);

    // Return unsubscribe function
    return () => {
      socket.off('listing:new', handler);
      eventHandlersRef.current.delete('listing:new');
    };
  }, [isConnected]);

  // Subscribe to notifications
  const subscribeToNotifications = useCallback((callback) => {
    if (!socketRef.current || !isConnected) {
      console.warn('Cannot subscribe: socket not connected');
      return () => {};
    }

    const socket = socketRef.current;

    // Listen for notifications
    const handler = (data) => {
      callback(data);
    };
    socket.on('notification', handler);
    eventHandlersRef.current.set('notification', handler);

    // Return unsubscribe function
    return () => {
      socket.off('notification', handler);
      eventHandlersRef.current.delete('notification');
    };
  }, [isConnected]);

  // Subscribe to inquiry updates
  const subscribeToInquiries = useCallback((callback) => {
    if (!socketRef.current || !isConnected) {
      console.warn('Cannot subscribe: socket not connected');
      return () => {};
    }

    const socket = socketRef.current;

    // Send subscription request
    socket.emit('subscribe:inquiries');

    // Listen for inquiry updates
    const handler = (data) => {
      callback(data);
    };
    socket.on('inquiry:update', handler);
    eventHandlersRef.current.set('inquiry:update', handler);

    // Return unsubscribe function
    return () => {
      socket.off('inquiry:update', handler);
      eventHandlersRef.current.delete('inquiry:update');
    };
  }, [isConnected]);

  // Generic event listener
  const on = useCallback((event, callback) => {
    if (!socketRef.current) return () => {};

    const socket = socketRef.current;
    socket.on(event, callback);
    eventHandlersRef.current.set(event, callback);

    return () => {
      socket.off(event, callback);
      eventHandlersRef.current.delete(event);
    };
  }, []);

  // Emit event
  const emit = useCallback((event, data) => {
    if (!socketRef.current || !isConnected) {
      console.warn('Cannot emit: socket not connected');
      return;
    }
    socketRef.current.emit(event, data);
  }, [isConnected]);

  // Ping/heartbeat
  const ping = useCallback(() => {
    if (!socketRef.current || !isConnected) return;
    
    socketRef.current.emit('ping');
    socketRef.current.once('pong', (data) => {
      const latency = Date.now() - data.timestamp;
      console.log('🏓 WebSocket latency:', latency, 'ms');
    });
  }, [isConnected]);

  return {
    isConnected,
    error,
    subscribeToPrices,
    subscribeToMarketplace,
    subscribeToNotifications,
    subscribeToInquiries,
    on,
    emit,
    ping,
    socket: socketRef.current
  };
}

/**
 * Simplified hook for price updates only
 */
export function usePriceUpdates(cropIds, onUpdate) {
  const { subscribeToPrices, isConnected } = useWebSocket();

  useEffect(() => {
    if (!isConnected || !cropIds || cropIds.length === 0) return;

    const unsubscribe = subscribeToPrices(cropIds, onUpdate);
    return unsubscribe;
  }, [cropIds, isConnected, subscribeToPrices, onUpdate]);

  return { isConnected };
}

/**
 * Simplified hook for marketplace updates
 */
export function useMarketplaceUpdates(filters, onUpdate) {
  const { subscribeToMarketplace, isConnected } = useWebSocket();

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribeToMarketplace(filters, onUpdate);
    return unsubscribe;
  }, [filters, isConnected, subscribeToMarketplace, onUpdate]);

  return { isConnected };
}

/**
 * Simplified hook for notifications
 */
export function useNotifications(onNotification) {
  const { subscribeToNotifications, isConnected } = useWebSocket();

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribeToNotifications(onNotification);
    return unsubscribe;
  }, [isConnected, subscribeToNotifications, onNotification]);

  return { isConnected };
}

export default useWebSocket;
