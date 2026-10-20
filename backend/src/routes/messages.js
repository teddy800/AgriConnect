import express from 'express';
import { auth } from '../middleware/auth.js';
import { q } from '../db.js';
import logger from '../utils/logger.js';

const router = express.Router();

// ============================================
// Direct Messaging System
// Real-time chat between farmers, buyers, and agents
// ============================================

/**
 * GET /api/messages/conversations
 * Get all conversations for current user
 */
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all conversations where user is participant
    const conversations = await q(
      `SELECT DISTINCT ON (conversation_id)
        c.id as conversation_id,
        c.created_at,
        CASE 
          WHEN c.user1_id = $1 THEN u2.id
          ELSE u1.id
        END as other_user_id,
        CASE 
          WHEN c.user1_id = $1 THEN u2.full_name
          ELSE u1.full_name
        END as other_user_name,
        CASE 
          WHEN c.user1_id = $1 THEN u2.phone
          ELSE u1.phone
        END as other_user_phone,
        CASE 
          WHEN c.user1_id = $1 THEN u2.role
          ELSE u1.role
        END as other_user_role,
        m.id as last_message_id,
        m.message_text as last_message,
        m.created_at as last_message_time,
        m.sender_id = $1 as sent_by_me,
        m.is_read,
        (SELECT COUNT(*) FROM messages m2 
         WHERE m2.conversation_id = c.id 
         AND m2.receiver_id = $1 
         AND m2.is_read = false) as unread_count
      FROM conversations c
      LEFT JOIN users u1 ON c.user1_id = u1.id
      LEFT JOIN users u2 ON c.user2_id = u2.id
      LEFT JOIN LATERAL (
        SELECT id, message_text, created_at, sender_id, is_read
        FROM messages
        WHERE conversation_id = c.id
        ORDER BY created_at DESC
        LIMIT 1
      ) m ON true
      WHERE c.user1_id = $1 OR c.user2_id = $1
      ORDER BY conversation_id, m.created_at DESC NULLS LAST`,
      [userId]
    );

    res.json({
      conversations,
      total: conversations.length,
      total_unread: conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)
    });
  } catch (error) {
    logger.error('Get conversations error', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

/**
 * GET /api/messages/conversation/:userId
 * Get or create conversation with specific user
 */
router.get('/conversation/:userId', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    if (currentUserId === otherUserId) {
      return res.status(400).json({ error: 'Cannot message yourself' });
    }

    // Check if conversation exists
    let [conversation] = await q(
      `SELECT id, user1_id, user2_id, created_at
       FROM conversations
       WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)`,
      [currentUserId, otherUserId]
    );

    // Create conversation if doesn't exist
    if (!conversation) {
      [conversation] = await q(
        `INSERT INTO conversations (user1_id, user2_id, created_at)
         VALUES ($1, $2, NOW())
         RETURNING id, user1_id, user2_id, created_at`,
        [currentUserId, otherUserId]
      );

      logger.info('New conversation created', {
        conversationId: conversation.id,
        user1: currentUserId,
        user2: otherUserId
      });
    }

    // Get other user info
    const [otherUser] = await q('SELECT id, full_name, phone, role FROM users WHERE id = $1', [
      otherUserId
    ]);

    if (!otherUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get messages
    const messages = await q(
      `SELECT id, sender_id, receiver_id, message_text, is_read, created_at
       FROM messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [conversation.id]
    );

    // Mark messages as read
    await q(
      `UPDATE messages SET is_read = true 
       WHERE conversation_id = $1 AND receiver_id = $2 AND is_read = false`,
      [conversation.id, currentUserId]
    );

    res.json({
      conversation_id: conversation.id,
      other_user: otherUser,
      messages: messages.map(m => ({
        ...m,
        sent_by_me: m.sender_id === currentUserId
      })),
      total_messages: messages.length
    });
  } catch (error) {
    logger.error('Get conversation error', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

/**
 * POST /api/messages/send
 * Send a message
 */
router.post('/send', auth, async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiver_id, message_text } = req.body;

    if (!receiver_id || !message_text) {
      return res.status(400).json({ error: 'Receiver ID and message text are required' });
    }

    if (senderId === receiver_id) {
      return res.status(400).json({ error: 'Cannot send message to yourself' });
    }

    if (message_text.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    if (message_text.length > 5000) {
      return res.status(400).json({ error: 'Message is too long (max 5000 characters)' });
    }

    // Check if receiver exists
    const [receiver] = await q('SELECT id FROM users WHERE id = $1', [receiver_id]);
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    // Get or create conversation
    let [conversation] = await q(
      `SELECT id FROM conversations
       WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)`,
      [senderId, receiver_id]
    );

    if (!conversation) {
      [conversation] = await q(
        `INSERT INTO conversations (user1_id, user2_id, created_at)
         VALUES ($1, $2, NOW())
         RETURNING id`,
        [senderId, receiver_id]
      );
    }

    // Insert message
    const [message] = await q(
      `INSERT INTO messages (conversation_id, sender_id, receiver_id, message_text, is_read, created_at)
       VALUES ($1, $2, $3, $4, false, NOW())
       RETURNING id, conversation_id, sender_id, receiver_id, message_text, is_read, created_at`,
      [conversation.id, senderId, receiver_id, message_text.trim()]
    );

    // Emit WebSocket event if io is available
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${receiver_id}`).emit('new_message', {
        conversation_id: conversation.id,
        message: {
          ...message,
          sender_name: req.user.full_name,
          sender_role: req.user.role
        }
      });
    }

    logger.info('Message sent', {
      messageId: message.id,
      from: senderId,
      to: receiver_id,
      conversationId: conversation.id
    });

    res.json({
      success: true,
      message,
      conversation_id: conversation.id
    });
  } catch (error) {
    logger.error('Send message error', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * PUT /api/messages/:messageId/read
 * Mark message as read
 */
router.put('/:messageId/read', auth, async (req, res) => {
  try {
    const messageId = parseInt(req.params.messageId);
    const userId = req.user.id;

    const [message] = await q(
      `UPDATE messages 
       SET is_read = true 
       WHERE id = $1 AND receiver_id = $2
       RETURNING id, is_read`,
      [messageId, userId]
    );

    if (!message) {
      return res.status(404).json({ error: 'Message not found or not authorized' });
    }

    res.json({ success: true, message });
  } catch (error) {
    logger.error('Mark read error', { error: error.message });
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

/**
 * GET /api/messages/unread-count
 * Get total unread message count
 */
router.get('/unread-count', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [result] = await q(
      'SELECT COUNT(*) as unread_count FROM messages WHERE receiver_id = $1 AND is_read = false',
      [userId]
    );

    res.json({ unread_count: parseInt(result.unread_count) || 0 });
  } catch (error) {
    logger.error('Unread count error', { error: error.message });
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

/**
 * DELETE /api/messages/conversation/:conversationId
 * Delete a conversation (soft delete - just hide for user)
 */
router.delete('/conversation/:conversationId', auth, async (req, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    const userId = req.user.id;

    // Verify user is part of conversation
    const [conversation] = await q(
      'SELECT id FROM conversations WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
      [conversationId, userId]
    );

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // For now, just mark messages as deleted for this user
    // In production, you might want a separate deleted_by_user field
    await q(
      `UPDATE messages 
       SET is_read = true 
       WHERE conversation_id = $1 AND receiver_id = $2`,
      [conversationId, userId]
    );

    res.json({ success: true, message: 'Conversation archived' });
  } catch (error) {
    logger.error('Delete conversation error', { error: error.message });
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

/**
 * POST /api/messages/typing
 * Notify other user that current user is typing
 */
router.post('/typing', auth, (req, res) => {
  try {
    const { conversation_id, typing } = req.body;
    const userId = req.user.id;

    const io = req.app.get('io');
    if (io) {
      // Broadcast typing status to conversation
      io.to(`conversation_${conversation_id}`).emit('user_typing', {
        user_id: userId,
        user_name: req.user.full_name,
        typing
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send typing status' });
  }
});

export default router;
