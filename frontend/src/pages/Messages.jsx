import { useState, useEffect, useRef } from 'react';
import { Send, Search, MessageCircle, User, Phone, Check, CheckCheck, Clock, Sparkles, Circle, MoreVertical, Paperclip, Smile } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';
import { useWebSocket } from '../hooks/useWebSocket';

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const socket = useWebSocket();

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (socket && socket.isConnected && user) {
      const unsubscribe = socket.on('new_message', (data) => {
        if (activeConversation && data.conversation_id === activeConversation.conversation_id) {
          setMessages(prev => [...prev, { ...data.message, sent_by_me: false }]);
          scrollToBottom();
          
          api.put(`/messages/${data.message.id}/read`).catch(console.error);
        }
        
        fetchConversations();
      });

      return unsubscribe;
    }
  }, [socket?.isConnected, user, activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const data = await api.get('/messages/conversations');
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (conversation) => {
    try {
      const data = await api.get(`/messages/conversation/${conversation.other_user_id}`);
      setActiveConversation({
        ...conversation,
        ...data
      });
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !activeConversation || sending) return;
    
    try {
      setSending(true);
      const response = await api.post('/messages/send', {
        receiver_id: activeConversation.other_user_id,
        message_text: newMessage.trim()
      });
      
      setMessages(prev => [...prev, { ...response.message, sent_by_me: true }]);
      setNewMessage('');
      scrollToBottom();
      
      fetchConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return date.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const filteredConversations = conversations.filter(c =>
    c.other_user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.last_message?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #E2F1E7 0%, #C6E4D0 100%)' }}>
        <div style={{ textAlign: 'center', background: 'white', padding: '48px 32px', borderRadius: '24px', boxShadow: '0 20px 60px rgba(15, 77, 42, 0.15)', maxWidth: '420px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #1B7F3B 0%, #0F4D2A 100%)', display: 'grid', placeItems: 'center', margin: '0 auto 24px', boxShadow: '0 8px 24px rgba(15, 77, 42, 0.25)' }}>
            <MessageCircle style={{ width: '40px', height: '40px', color: 'white' }} />
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '12px', color: '#0F4D2A' }}>Login Required</h2>
          <p style={{ color: '#60756A', fontSize: '15px', lineHeight: '1.6' }}>Please login to access your messages and start connecting with farmers and buyers</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: '100%', padding: '0', height: 'calc(100vh - 72px)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '0', height: '100%', background: 'white', borderRadius: '0', overflow: 'hidden' }}>
        
        {/* Conversations Sidebar */}
        <div style={{ background: 'linear-gradient(180deg, #F8FCF9 0%, white 100%)', borderRight: '1px solid #DAE7DE', display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Sidebar Header */}
          <div style={{ padding: '24px 20px', borderBottom: '1px solid #DAE7DE', background: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg, #1B7F3B 0%, #0F4D2A 100%)', display: 'grid', placeItems: 'center', boxShadow: '0 4px 12px rgba(15, 77, 42, 0.2)' }}>
                <MessageCircle style={{ width: '24px', height: '24px', color: 'white' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0F4D2A', lineHeight: '1.2', marginBottom: '4px' }}>Messages</h2>
                <p style={{ fontSize: '13px', color: '#60756A', fontWeight: '600' }}>
                  {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#60756A' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                style={{ width: '100%', paddingLeft: '44px', paddingRight: '14px', height: '44px', border: '2px solid #E2F1E7', borderRadius: '12px', fontSize: '14px', background: 'white', transition: 'all 0.2s' }}
                onFocus={(e) => e.target.style.borderColor = '#1B7F3B'}
                onBlur={(e) => e.target.style.borderColor = '#E2F1E7'}
              />
            </div>
          </div>

          {/* Conversations List */}
          <div style={{ flex: '1', overflowY: 'auto', padding: '8px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', paddingTop: '48px' }}>
                <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid #E2F1E7', borderTop: '3px solid #1B7F3B', borderRadius: '50%', margin: '0 auto 12px' }}></div>
                <p style={{ color: '#60756A', fontSize: '13px', fontWeight: '600' }}>Loading conversations...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#E2F1E7', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
                  <MessageCircle style={{ width: '32px', height: '32px', color: '#60756A' }} />
                </div>
                <p style={{ fontSize: '14px', color: '#60756A', fontWeight: '600', marginBottom: '6px' }}>No conversations yet</p>
                <p style={{ fontSize: '12px', color: '#8FA599' }}>Start chatting from listings</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.conversation_id}
                    onClick={() => loadConversation(conv)}
                    style={{
                      padding: '14px',
                      borderRadius: '14px',
                      border: activeConversation?.conversation_id === conv.conversation_id ? '2px solid #1B7F3B' : '2px solid transparent',
                      background: activeConversation?.conversation_id === conv.conversation_id ? 'linear-gradient(135deg, #E2F1E7 0%, #F1F8F3 100%)' : 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      position: 'relative',
                      boxShadow: activeConversation?.conversation_id === conv.conversation_id ? '0 4px 12px rgba(27, 127, 59, 0.1)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (activeConversation?.conversation_id !== conv.conversation_id) {
                        e.currentTarget.style.background = '#F8FCF9';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeConversation?.conversation_id !== conv.conversation_id) {
                        e.currentTarget.style.background = 'white';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #1B7F3B 0%, #0F4D2A 100%)', display: 'grid', placeItems: 'center', flexShrink: '0', position: 'relative', boxShadow: '0 2px 8px rgba(15, 77, 42, 0.2)' }}>
                        <User style={{ width: '24px', height: '24px', color: 'white' }} />
                        {socket?.isConnected && <Circle style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '14px', height: '14px', fill: '#22C55E', color: '#22C55E', background: 'white', borderRadius: '50%' }} />}
                      </div>
                      
                      <div style={{ flex: '1', minWidth: '0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0F4D2A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                            {conv.other_user_name}
                          </h3>
                          {conv.unread_count > 0 && (
                            <span style={{ background: '#1B7F3B', color: 'white', fontSize: '11px', fontWeight: '800', borderRadius: '10px', minWidth: '22px', height: '22px', display: 'grid', placeItems: 'center', padding: '0 6px', boxShadow: '0 2px 6px rgba(27, 127, 59, 0.3)' }}>
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        
                        <p style={{ fontSize: '12px', color: '#60756A', marginBottom: '6px', fontWeight: '600' }}>
                          <span style={{ padding: '2px 8px', background: '#E2F1E7', borderRadius: '6px', textTransform: 'capitalize', fontSize: '11px', fontWeight: '700', color: '#1B7F3B' }}>
                            {conv.other_user_role}
                          </span>
                          <span style={{ margin: '0 6px' }}>•</span>
                          {conv.other_user_phone}
                        </p>
                        
                        {conv.last_message && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <p style={{ fontSize: '13px', color: conv.unread_count > 0 ? '#14261B' : '#8FA599', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: '1', fontWeight: conv.unread_count > 0 ? '600' : '500' }}>
                              {conv.sent_by_me && (
                                conv.is_read ? 
                                  <CheckCheck style={{ width: '14px', height: '14px', display: 'inline', marginRight: '4px', color: '#1B7F3B' }} /> :
                                  <Check style={{ width: '14px', height: '14px', display: 'inline', marginRight: '4px', color: '#8FA599' }} />
                              )}
                              {conv.last_message}
                            </p>
                            <span style={{ fontSize: '11px', color: '#8FA599', flexShrink: '0', fontWeight: '600' }}>
                              {formatTime(conv.last_message_time)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'linear-gradient(180deg, white 0%, #F8FCF9 100%)' }}>
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #DAE7DE', background: 'white', boxShadow: '0 1px 3px rgba(15, 77, 42, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg, #1B7F3B 0%, #0F4D2A 100%)', display: 'grid', placeItems: 'center', boxShadow: '0 4px 12px rgba(15, 77, 42, 0.2)', position: 'relative' }}>
                      <User style={{ width: '26px', height: '26px', color: 'white' }} />
                      {socket?.isConnected && <Circle style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '16px', height: '16px', fill: '#22C55E', color: '#22C55E', background: 'white', borderRadius: '50%' }} />}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F4D2A', marginBottom: '4px' }}>{activeConversation.other_user.full_name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ padding: '3px 10px', background: '#E2F1E7', borderRadius: '8px', fontSize: '12px', fontWeight: '700', color: '#1B7F3B', textTransform: 'capitalize' }}>
                          {activeConversation.other_user.role}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#60756A', fontSize: '13px', fontWeight: '600' }}>
                          <Phone style={{ width: '14px', height: '14px' }} />
                          <span>{activeConversation.other_user.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid #DAE7DE', background: 'white', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                    <MoreVertical style={{ width: '18px', height: '18px', color: '#60756A' }} />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div style={{ flex: '1', overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {messages.length === 0 ? (
                  <div style={{ flex: '1', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                    <div>
                      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #E2F1E7 0%, #C6E4D0 100%)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
                        <Sparkles style={{ width: '40px', height: '40px', color: '#1B7F3B' }} />
                      </div>
                      <p style={{ fontSize: '16px', fontWeight: '700', color: '#0F4D2A', marginBottom: '6px' }}>No messages yet</p>
                      <p style={{ fontSize: '13px', color: '#60756A' }}>Start the conversation by saying hi!</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={msg.id || idx}
                      style={{ display: 'flex', justifyContent: msg.sent_by_me ? 'flex-end' : 'flex-start', animation: 'slideUp 0.3s ease-out' }}
                    >
                      <div
                        style={{
                          maxWidth: '70%',
                          padding: '12px 16px',
                          borderRadius: msg.sent_by_me ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          background: msg.sent_by_me ? 'linear-gradient(135deg, #1B7F3B 0%, #0F4D2A 100%)' : 'white',
                          color: msg.sent_by_me ? 'white' : '#14261B',
                          boxShadow: msg.sent_by_me ? '0 4px 12px rgba(15, 77, 42, 0.25)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
                          border: msg.sent_by_me ? 'none' : '1px solid #E2F1E7'
                        }}
                      >
                        <p style={{ fontSize: '14px', lineHeight: '1.5', marginBottom: '6px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.message_text}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: msg.sent_by_me ? 'rgba(255,255,255,0.8)' : '#8FA599', fontWeight: '600' }}>
                          <Clock style={{ width: '12px', height: '12px' }} />
                          <span>{formatTime(msg.created_at)}</span>
                          {msg.sent_by_me && (
                            msg.is_read ? 
                              <CheckCheck style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.9)' }} /> :
                              <Check style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.7)' }} />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={sendMessage} style={{ padding: '20px 24px', borderTop: '1px solid #DAE7DE', background: 'white' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                  <button type="button" style={{ width: '44px', height: '44px', borderRadius: '12px', border: '1px solid #DAE7DE', background: 'white', display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: '0' }}>
                    <Paperclip style={{ width: '20px', height: '20px', color: '#60756A' }} />
                  </button>
                  <div style={{ flex: '1', position: 'relative' }}>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      disabled={sending}
                      style={{ width: '100%', padding: '12px 50px 12px 16px', border: '2px solid #E2F1E7', borderRadius: '14px', fontSize: '14px', background: '#F8FCF9', transition: 'all 0.2s' }}
                      onFocus={(e) => e.target.style.borderColor = '#1B7F3B'}
                      onBlur={(e) => e.target.style.borderColor = '#E2F1E7'}
                    />
                    <button type="button" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'transparent', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                      <Smile style={{ width: '20px', height: '20px', color: '#60756A' }} />
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      border: 'none',
                      background: newMessage.trim() && !sending ? 'linear-gradient(135deg, #1B7F3B 0%, #0F4D2A 100%)' : '#E2F1E7',
                      color: 'white',
                      display: 'grid',
                      placeItems: 'center',
                      cursor: newMessage.trim() && !sending ? 'pointer' : 'not-allowed',
                      flexShrink: '0',
                      boxShadow: newMessage.trim() && !sending ? '0 4px 12px rgba(15, 77, 42, 0.3)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Send style={{ width: '20px', height: '20px' }} />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div style={{ flex: '1', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
              <div>
                <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(135deg, #E2F1E7 0%, #C6E4D0 100%)', display: 'grid', placeItems: 'center', margin: '0 auto 24px', boxShadow: '0 8px 24px rgba(15, 77, 42, 0.1)' }}>
                  <MessageCircle style={{ width: '60px', height: '60px', color: '#1B7F3B' }} />
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#0F4D2A', marginBottom: '8px' }}>Select a Conversation</h3>
                <p style={{ fontSize: '14px', color: '#60756A' }}>Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
