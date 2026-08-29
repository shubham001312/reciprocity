import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api';
import { Send, Search, X, MessageSquare, User, Clock, ArrowLeft } from 'lucide-react';

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [searchUsers, setSearchUsers] = useState('');
  const messagesEnd = useRef(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [convRes, usersRes] = await Promise.all([
        api.get('/messages/conversations'),
        api.get('/users/students').catch(() => api.get('/users').catch(() => ({ data: [] }))),
      ]);
      setConversations(convRes.data);
      setAllUsers(usersRes.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const openChat = async (partnerId) => {
    setActiveChat(partnerId);
    try {
      const res = await api.get(`/messages/${partnerId}`);
      setMessages(res.data);
      // Refresh conversations to update unread
      const convRes = await api.get('/messages/conversations');
      setConversations(convRes.data);
    } catch (err) { console.error(err); }
    setTimeout(() => messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;
    setSending(true);
    try {
      await api.post('/messages', { to: activeChat, content: newMessage });
      setNewMessage('');
      openChat(activeChat);
    } catch (err) { console.error(err); }
    setSending(false);
  };

  const filteredUsers = allUsers.filter(u => {
    if (u.id === user?.id) return false;
    if (!searchUsers) return true;
    const q = searchUsers.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  };

  const activePartner = conversations.find(c => c.partnerId === activeChat) || allUsers.find(u => u.id === activeChat);

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare size={24} className="text-teal" />
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">Messages</h1>
          <p className="text-ink-soft text-sm">Communicate with professors and students</p>
        </div>
      </div>

      <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden flex" style={{ height: 'calc(100vh - 220px)', minHeight: '400px' }}>
        {/* Sidebar - Conversations */}
        <div className={`w-80 border-r border-line flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
          {/* Search */}
          <div className="p-3 border-b border-line">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input type="text" value={searchUsers} onChange={e => setSearchUsers(e.target.value)}
                placeholder="Search or start new chat..."
                className="w-full pl-9 pr-3 py-2 border border-line rounded-lg text-xs bg-paper-dim focus:outline-none focus:border-teal" />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {searchUsers ? (
              filteredUsers.map(u => (
                <button key={u.id} onClick={() => { setActiveChat(u.id); setSearchUsers(''); openChat(u.id); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-paper-dim transition-colors text-left cursor-pointer border-b border-line/50">
                  <div className="w-9 h-9 rounded-full bg-teal-bg flex items-center justify-center text-xs font-bold text-teal shrink-0">
                    {u.name?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{u.name}</div>
                    <div className="text-[10px] text-ink-muted">{u.email}</div>
                  </div>
                </button>
              ))
            ) : loading ? (
              <div className="p-4 text-center text-ink-muted text-xs">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare size={24} className="mx-auto text-ink-muted/30 mb-2" />
                <p className="text-xs text-ink-muted">No conversations yet</p>
                <p className="text-[10px] text-ink-muted mt-1">Search above to start chatting</p>
              </div>
            ) : (
              conversations.map(c => (
                <button key={c.partnerId} onClick={() => openChat(c.partnerId)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-paper-dim transition-colors text-left cursor-pointer border-b border-line/50 ${
                    activeChat === c.partnerId ? 'bg-teal-bg' : ''
                  }`}>
                  <div className="w-9 h-9 rounded-full bg-teal-bg flex items-center justify-center text-xs font-bold text-teal shrink-0">
                    {c.partnerName?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{c.partnerName}</span>
                      <span className="text-[10px] text-ink-muted shrink-0">{timeAgo(c.lastMessageAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-ink-muted truncate">{c.lastMessage}</span>
                      {c.unread > 0 && (
                        <span className="w-5 h-5 rounded-full bg-teal text-paper text-[10px] font-bold flex items-center justify-center shrink-0 ml-2">{c.unread}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-line bg-paper-dim/50">
                <button onClick={() => setActiveChat(null)} className="md:hidden text-ink-soft hover:text-ink cursor-pointer">
                  <ArrowLeft size={18} />
                </button>
                <div className="w-9 h-9 rounded-full bg-teal-bg flex items-center justify-center text-xs font-bold text-teal">
                  {activePartner?.partnerName?.split(' ').map(n => n[0]).join('').substring(0, 2) || activePartner?.name?.split(' ').map(n => n[0]).join('').substring(0, 2) || '?'}
                </div>
                <div>
                  <div className="text-sm font-medium">{activePartner?.partnerName || activePartner?.name || 'User'}</div>
                  <div className="text-[10px] text-ink-muted capitalize">{activePartner?.partnerRole || activePartner?.role || ''}</div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(m => {
                  const isMine = m.from === user?.id;
                  return (
                    <div key={m._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                        isMine
                          ? 'bg-teal text-paper rounded-br-md'
                          : 'bg-paper-dim text-ink rounded-bl-md'
                      }`}>
                        <p>{m.content}</p>
                        <div className={`text-[9px] mt-1 ${isMine ? 'text-paper/50' : 'text-ink-muted'}`}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isMine && !m.read && <span className="ml-1">✓</span>}
                          {isMine && m.read && <span className="ml-1">✓✓</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEnd} />
              </div>

              {/* Send Form */}
              <form onSubmit={sendMessage} className="flex items-center gap-2 p-3 border-t border-line">
                <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 border border-line rounded-xl px-4 py-2.5 text-sm bg-paper focus:outline-none focus:border-teal" />
                <button type="submit" disabled={!newMessage.trim() || sending}
                  className="w-10 h-10 rounded-xl bg-teal text-paper flex items-center justify-center hover:bg-teal/90 disabled:opacity-30 transition-all cursor-pointer disabled:cursor-not-allowed shrink-0">
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <MessageSquare size={48} className="mx-auto text-ink-muted/20 mb-4" />
                <h3 className="font-serif text-lg font-semibold text-ink mb-1">Select a Conversation</h3>
                <p className="text-sm text-ink-muted">Choose from existing chats or start a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
