import { useState, useEffect, useRef } from 'react';
import { Send, Search, MessageCircle, User, Phone, Check, CheckCheck, Clock } from 'lucide-react';
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
      // Listen for new messages using the hook's on method
      const unsubscribe = socket.on('new_message', (data) => {
        if (activeConversation && data.conversation_id === activeConversation.conversation_id) {
          setMessages(prev => [...prev, { ...data.message, sent_by_me: false }]);
          scrollToBottom();
          
          // Mark as read
          api.put(`/messages/${data.message.id}/read`).catch(console.error);
        }
        
        // Refresh conversations list
        fetchConversations();
      });

      return unsubscribe; // The hook's on method returns a cleanup function
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
      
      // Refresh conversations to update last message
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center card max-w-md">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600">Please login to access your messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 h-[calc(100vh-120px)]">
      <div className="grid md:grid-cols-3 gap-4 h-full">
        {/* Conversations List */}
        <div className="md:col-span-1 flex flex-col card h-full">
          <div className="border-b pb-4 mb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <MessageCircle className="w-7 h-7 text-green-600" />
              Messages
            </h2>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-center py-8">
                <div className="spinner mx-auto mb-2"></div>
                <p className="text-gray-500 text-sm">Loading conversations...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Start by contacting farmers or buyers from listings</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.conversation_id}
                  onClick={() => loadConversation(conv)}
                  className={`p-3 rounded-lg cursor-pointer transition ${
                    activeConversation?.conversation_id === conv.conversation_id
                      ? 'bg-green-50 border-2 border-green-500'
                      : 'hover:bg-gray-50 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-green-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-bold text-gray-900 truncate">{conv.other_user_name}</h3>
                        {conv.unread_count > 0 && (
                          <span className="bg-green-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-1">
                        {conv.other_user_role} • {conv.other_user_phone}
                      </p>
                      
                      {conv.last_message && (
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-600 truncate flex-1">
                            {conv.sent_by_me && (
                              conv.is_read ? 
                                <CheckCheck className="w-4 h-4 inline text-blue-500 mr-1" /> :
                                <Check className="w-4 h-4 inline text-gray-400 mr-1" />
                            )}
                            {conv.last_message}
                          </p>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {formatTime(conv.last_message_time)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="md:col-span-2 flex flex-col card h-full">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="border-b pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{activeConversation.other_user.full_name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                        {activeConversation.other_user.role}
                      </span>
                      <Phone className="w-4 h-4" />
                      <span>{activeConversation.other_user.phone}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-3 px-2">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs mt-1">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={msg.id || idx}
                      className={`flex ${msg.sent_by_me ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          msg.sent_by_me
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.message_text}</p>
                        <div className={`flex items-center gap-1 mt-1 text-xs ${
                          msg.sent_by_me ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(msg.created_at)}</span>
                          {msg.sent_by_me && (
                            msg.is_read ? 
                              <CheckCheck className="w-4 h-4 text-white ml-1" /> :
                              <Check className="w-4 h-4 text-green-200 ml-1" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">Select a Conversation</h3>
                <p className="text-sm">Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
