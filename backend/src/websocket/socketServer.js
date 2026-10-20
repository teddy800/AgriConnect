/**
 * WebSocket Server for Real-Time Updates
 * Provides live price updates, notifications, and inquiry status changes
 */

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Connected users map: userId -> socket
const connectedUsers = new Map();

// Room subscriptions: roomName -> Set of userIds
const roomSubscriptions = new Map();

/**
 * Initialize WebSocket server
 */
export function initializeWebSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      socket.userName = decoded.name;

      logger.info('WebSocket client authenticated', {
        userId: socket.userId,
        role: socket.userRole,
        socketId: socket.id
      });

      next();
    } catch (error) {
      logger.warn('WebSocket authentication failed', { error: error.message });
      next(new Error('Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', socket => {
    const userId = socket.userId;

    // Store connection
    connectedUsers.set(userId, socket);

    logger.info('WebSocket client connected', {
      userId,
      socketId: socket.id,
      totalConnections: connectedUsers.size
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to AgriConnect real-time service',
      userId,
      timestamp: new Date().toISOString()
    });

    // Subscribe to personal channel
    socket.join(`user:${userId}`);

    // Handle room subscriptions
    socket.on('subscribe:prices', data => {
      const { cropIds = [] } = data;

      cropIds.forEach(cropId => {
        const room = `prices:crop:${cropId}`;
        socket.join(room);

        if (!roomSubscriptions.has(room)) {
          roomSubscriptions.set(room, new Set());
        }
        roomSubscriptions.get(room).add(userId);
      });

      logger.info('User subscribed to price updates', { userId, cropIds });
      socket.emit('subscribed:prices', { cropIds, success: true });
    });

    socket.on('unsubscribe:prices', data => {
      const { cropIds = [] } = data;

      cropIds.forEach(cropId => {
        const room = `prices:crop:${cropId}`;
        socket.leave(room);

        const subscribers = roomSubscriptions.get(room);
        if (subscribers) {
          subscribers.delete(userId);
          if (subscribers.size === 0) {
            roomSubscriptions.delete(room);
          }
        }
      });

      logger.info('User unsubscribed from price updates', { userId, cropIds });
      socket.emit('unsubscribed:prices', { cropIds, success: true });
    });

    // Subscribe to marketplace updates
    socket.on('subscribe:marketplace', data => {
      const { regionId, cropId } = data;

      if (regionId) socket.join(`marketplace:region:${regionId}`);
      if (cropId) socket.join(`marketplace:crop:${cropId}`);

      logger.info('User subscribed to marketplace', { userId, regionId, cropId });
      socket.emit('subscribed:marketplace', { success: true });
    });

    // Subscribe to inquiry updates (farmers and buyers)
    socket.on('subscribe:inquiries', () => {
      socket.join(`inquiries:user:${userId}`);
      logger.info('User subscribed to inquiry updates', { userId });
      socket.emit('subscribed:inquiries', { success: true });
    });

    // Heartbeat/ping
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Disconnect handler
    socket.on('disconnect', reason => {
      connectedUsers.delete(userId);

      // Clean up room subscriptions
      roomSubscriptions.forEach((subscribers, room) => {
        subscribers.delete(userId);
        if (subscribers.size === 0) {
          roomSubscriptions.delete(room);
        }
      });

      logger.info('WebSocket client disconnected', {
        userId,
        socketId: socket.id,
        reason,
        totalConnections: connectedUsers.size
      });
    });

    // Error handler
    socket.on('error', error => {
      logger.error('WebSocket error', {
        userId,
        socketId: socket.id,
        error: error.message
      });
    });
  });

  return io;
}

/**
 * Broadcast price update to subscribers
 */
export function broadcastPriceUpdate(io, priceData) {
  const { crop_id, market_id, price, recorded_on } = priceData;
  const room = `prices:crop:${crop_id}`;

  io.to(room).emit('price:update', {
    cropId: crop_id,
    marketId: market_id,
    price,
    recordedOn: recorded_on,
    timestamp: new Date().toISOString()
  });

  logger.info('Price update broadcasted', {
    room,
    cropId: crop_id,
    subscribers: roomSubscriptions.get(room)?.size || 0
  });
}

/**
 * Send notification to specific user
 */
export function sendNotificationToUser(io, userId, notification) {
  io.to(`user:${userId}`).emit('notification', {
    id: notification.id,
    type: notification.type,
    message: notification.message,
    createdAt: notification.created_at,
    isRead: notification.is_read
  });

  logger.info('Notification sent to user', { userId, type: notification.type });
}

/**
 * Broadcast new listing to marketplace subscribers
 */
export function broadcastNewListing(io, listing) {
  // Broadcast to region subscribers
  io.to(`marketplace:region:${listing.region_id}`).emit('listing:new', {
    id: listing.id,
    title: listing.title,
    crop: listing.crop,
    region: listing.region,
    price: listing.price_per_unit,
    quantity: listing.quantity,
    unit: listing.unit,
    farmer: listing.farmer,
    timestamp: new Date().toISOString()
  });

  // Broadcast to crop subscribers
  io.to(`marketplace:crop:${listing.crop_id}`).emit('listing:new', {
    id: listing.id,
    title: listing.title,
    crop: listing.crop,
    region: listing.region,
    price: listing.price_per_unit,
    quantity: listing.quantity,
    unit: listing.unit,
    farmer: listing.farmer,
    timestamp: new Date().toISOString()
  });

  logger.info('New listing broadcasted', { listingId: listing.id });
}

/**
 * Send inquiry status update
 */
export function sendInquiryUpdate(io, inquiry) {
  // Notify buyer
  io.to(`user:${inquiry.buyer_id}`).emit('inquiry:update', {
    id: inquiry.id,
    listingId: inquiry.listing_id,
    status: inquiry.status,
    timestamp: new Date().toISOString()
  });

  // Notify farmer (if from listings table join)
  if (inquiry.farmer_id) {
    io.to(`user:${inquiry.farmer_id}`).emit('inquiry:update', {
      id: inquiry.id,
      listingId: inquiry.listing_id,
      status: inquiry.status,
      timestamp: new Date().toISOString()
    });
  }

  logger.info('Inquiry update sent', { inquiryId: inquiry.id, status: inquiry.status });
}

/**
 * Get connection statistics
 */
export function getConnectionStats() {
  return {
    totalConnections: connectedUsers.size,
    activeRooms: roomSubscriptions.size,
    roomDetails: Array.from(roomSubscriptions.entries()).map(([room, subscribers]) => ({
      room,
      subscribers: subscribers.size
    }))
  };
}

/**
 * Send message to all connected clients
 */
export function broadcastToAll(io, event, data) {
  io.emit(event, data);
  logger.info('Broadcast to all clients', { event, totalClients: connectedUsers.size });
}

export default {
  initializeWebSocket,
  broadcastPriceUpdate,
  sendNotificationToUser,
  broadcastNewListing,
  sendInquiryUpdate,
  getConnectionStats,
  broadcastToAll
};
