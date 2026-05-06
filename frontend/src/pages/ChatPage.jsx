import React, { useState, useEffect, useRef } from 'react';
import { chatApi } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { Send, Hash, Users, FolderKanban, Loader2, Menu, Search, X, MessageSquare, Paperclip, File } from 'lucide-react';
import { Layout, TopBar } from '../components/Layout';
import { Modal } from '../components/Modal';

export const ChatPage = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchGroups();
    
    // Set up polling to get live updates for background chat groups (unread badges, latest message text, etc.)
    const interval = setInterval(() => {
      fetchGroups(true);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [activeGroupId]); // Re-bind interval so activeGroupId is fresh

  useEffect(() => {
    if (activeGroupId) {
      fetchMessages(activeGroupId);
      connectWebSocket(activeGroupId);
    }
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [activeGroupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchGroups = async (isPolling = false) => {
    try {
      const res = await chatApi.getGroups();
      const loadedGroups = res.data?.results || res.data || [];
      
      setGroups(prev => {
        // If polling, we want to update the latest message and unread counts
        // but force unread_count to 0 for the active group.
        const mergedGroups = loadedGroups.map(lg => {
          if (lg.id === activeGroupId) {
            return { ...lg, unread_count: 0 };
          }
          return lg;
        });
        return mergedGroups.sort((a, b) => new Date(b.latest_message_time || b.created_at) - new Date(a.latest_message_time || a.created_at));
      });
    } catch (err) {
      if (!isPolling) console.error('Failed to fetch groups', err);
    } finally {
      if (!isPolling) setLoadingGroups(false);
    }
  };

  const fetchMessages = async (groupId) => {
    setLoadingMessages(true);
    try {
      const res = await chatApi.getMessages(groupId);
      const fetchedMessages = res.data?.results || res.data || [];
      setMessages([...fetchedMessages].reverse());
      
      // Mark as read when fetching messages
      chatApi.markRead(groupId).catch(console.error);
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, unread_count: 0 } : g));
    } catch (err) {
      console.error('Failed to fetch messages', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const connectWebSocket = (groupId) => {
    if (ws) {
      ws.close();
    }
    const token = localStorage.getItem('access');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
    const socket = new WebSocket(`${protocol}//${host}/ws/chat/${groupId}/?token=${token}`);

    socket.onopen = () => {
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
      setGroups((prevGroups) => {
        const newGroups = prevGroups.map(g => {
          if (g.id === groupId) {
            return {
              ...g,
              latest_message_content: data.content || data.message,
              latest_message_time: new Date().toISOString(),
              unread_count: g.id === activeGroupId ? 0 : (g.unread_count || 0) + 1
            };
          }
          return g;
        });
        return newGroups.sort((a, b) => new Date(b.latest_message_time || b.created_at) - new Date(a.latest_message_time || a.created_at));
      });
      
      if (activeGroupId === groupId) {
        chatApi.markRead(groupId).catch(console.error);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
    };

    setWs(socket);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || !ws || !isConnected) return;
    
    ws.send(JSON.stringify({ message: inputMsg }));
    setInputMsg('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeGroup) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('attachment', file);
    formData.append('content', ''); // Optional caption can be added later

    try {
      await chatApi.sendMessageWithFile(activeGroup.id, formData);
      // We don't need to manually update state here because the broadcast will arrive via WebSocket
    } catch (err) {
      console.error('File upload failed:', err);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const activeGroup = groups.find(g => g.id === activeGroupId);
  const filteredGroups = groups.filter(g => g.name && g.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <Layout>
      <TopBar title="Team Chat" subtitle="Real-time communication across projects and teams" />
      <div className="page animate-in" style={{ padding: 0, height: 'calc(100vh - 100px)' }}>
        <div className="chat-container">
            {/* Chat Sidebar */}
            <div className={`chat-sidebar ${mobileMenuOpen ? 'open' : ''}`} style={{ width: '230px' }}>
              <div className="chat-sidebar-header" style={{ borderBottom: 'none', paddingBottom: '8px' }}>
                <h3 style={{ fontSize: '14px' }}>Conversations</h3>
                <button className="chat-mobile-close" onClick={() => setMobileMenuOpen(false)}>×</button>
              </div>
              <div style={{ padding: '0 15px 20px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder="Search chats..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ 
                      width: '100%', padding: '6px 10px 6px 30px', 
                      borderRadius: 20, border: '1px solid var(--border)', 
                      fontSize: 12, background: 'var(--bg-elevated)',
                      color: 'var(--text-primary)', outline: 'none'
                    }} 
                  />
                </div>
              </div>
              <div className="chat-group-list">
                {loadingGroups ? (
                  <div className="chat-loader"><Loader2 className="spinner" /></div>
                ) : filteredGroups.length === 0 ? (
                  <p className="chat-empty">{searchQuery ? "No chats found." : "No active chats."}</p>
                ) : (
                  filteredGroups.map((group) => (
                    <div 
                      key={group.id} 
                      className={`chat-group-item ${activeGroupId === group.id ? 'active' : ''}`}
                      onClick={() => {
                        setActiveGroupId(group.id);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <div className="chat-group-icon">
                        {group.type === 'team' ? <Users size={18} /> : 
                         group.type === 'project' ? <FolderKanban size={18} /> : 
                         <Hash size={18} />}
                      </div>
                      <div className="chat-group-info">
                        <div className="chat-group-name" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                          <span>{group.name}</span>
                          {group.latest_message_time && (
                            <span style={{ fontSize: 10, color: group.unread_count > 0 ? 'var(--blue)' : 'var(--text-muted)', fontWeight: group.unread_count > 0 ? 'bold' : 'normal' }}>
                              {new Date(group.latest_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <div className="chat-group-type" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                          <span>
                            {group.latest_message_content 
                              ? group.latest_message_content.substring(0, 25) + (group.latest_message_content.length > 25 ? '...' : '') 
                              : `${group.type} chat`}
                          </span>
                          {group.unread_count > 0 && (
                            <span style={{ 
                              background: 'var(--blue)', color: 'white', fontSize: 10, 
                              padding: '2px 6px', borderRadius: 10, fontWeight: 'bold',
                              minWidth: '20px', textAlign: 'center'
                            }}>
                              {group.unread_count > 9 ? '9+' : group.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="chat-area">
              {activeGroupId ? (
                <>
                  <div className="chat-header">
                    <button className="chat-mobile-toggle" onClick={() => setMobileMenuOpen(true)}>
                      <Menu size={20} />
                    </button>
                    <div className="chat-header-info">
                      <h2>{activeGroup?.name}</h2>
                      <span className={`chat-status ${isConnected ? 'online' : 'offline'}`}>
                        <span className="status-dot"></span>
                        {isConnected ? 'Connected' : 'Connecting...'}
                      </span>
                    </div>
                    {activeGroup?.participants && activeGroup.participants.length > 0 && (
                      <div 
                        onClick={() => setShowMembersModal(true)}
                        style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '4px 8px', borderRadius: 8, transition: 'background 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        title="View all members"
                      >
                        <div style={{ display: 'flex', marginRight: 10 }}>
                          {activeGroup.participants.slice(0, 5).map((p, i) => (
                            <div 
                              key={p.id} 
                              title={p.name}
                              style={{
                                width: 32, height: 32, borderRadius: '50%',
                                background: 'var(--blue-muted)', color: 'var(--blue)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 11, fontWeight: 'bold', border: '2px solid var(--bg-surface)',
                                marginLeft: i > 0 ? -12 : 0, zIndex: 10 - i, overflow: 'hidden'
                              }}
                            >
                              {p.avatar ? <img src={p.avatar} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : p.initials}
                            </div>
                          ))}
                          {activeGroup.participants.length > 5 && (
                            <div 
                              style={{
                                width: 32, height: 32, borderRadius: '50%',
                                background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 11, fontWeight: 'bold', border: '2px solid var(--bg-surface)',
                                marginLeft: -12, zIndex: 0
                              }}
                            >
                              +{activeGroup.participants.length - 5}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                          {activeGroup.participants.length} Member{activeGroup.participants.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="chat-messages">
                    {loadingMessages ? (
                      <div className="chat-loader"><Loader2 className="spinner" /></div>
                    ) : (
                      messages.map((msg, idx) => {
                        const msgSenderId = msg.sender?.id || msg.sender_id;
                        const _isMine = msgSenderId === user?.id;
                        const msgSenderName = typeof msg.sender === 'string' 
                            ? msg.sender 
                            : (msg.sender?.first_name 
                                ? `${msg.sender.first_name} ${msg.sender.last_name}`.trim() 
                                : (msg.sender?.username || 'User'));
                            
                        return (
                          <div key={msg.id || idx} className={`chat-message-wrapper ${_isMine ? 'mine' : ''}`}>
                            {!_isMine && (
                              <div className="chat-message-avatar" style={{ overflow: 'hidden' }}>
                                {msg.sender?.avatar ? (
                                  <img src={msg.sender.avatar} alt={msgSenderName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  msgSenderName[0]?.toUpperCase()
                                )}
                              </div>
                            )}
                            <div className="chat-message-content">
                              {!_isMine && <div className="chat-message-sender">{msgSenderName}</div>}
                              <div className="chat-message-bubble">
                                {msg.content || msg.message}
                                {msg.attachment && (
                                  <div className="chat-attachment" style={{ marginTop: msg.content || msg.message ? 8 : 0 }}>
                                    {msg.attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                      <a href={msg.attachment} target="_blank" rel="noopener noreferrer">
                                        <img 
                                          src={msg.attachment} 
                                          alt="Attachment" 
                                          style={{ maxWidth: '100%', borderRadius: 8, cursor: 'zoom-in', display: 'block' }} 
                                        />
                                      </a>
                                    ) : (
                                      <a 
                                        href={msg.attachment} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        style={{ 
                                          display: 'flex', alignItems: 'center', gap: 8, 
                                          background: 'var(--bg-elevated)', padding: '8px 12px', 
                                          borderRadius: 8, textDecoration: 'none', color: 'inherit',
                                          border: '1px solid var(--border)'
                                        }}
                                      >
                                        <File size={20} className="text-blue" />
                                        <span style={{ fontSize: 13, fontWeight: 500 }}>
                                          {msg.attachment.split('/').pop().split('?')[0]}
                                        </span>
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="chat-message-time">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <form className="chat-input-area" onSubmit={handleSendMessage}>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      style={{ display: 'none' }} 
                    />
                    <button 
                      type="button" 
                      className="icon-btn" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      title="Attach file"
                    >
                      {uploading ? <Loader2 className="spinner" size={18} /> : <Paperclip size={18} />}
                    </button>
                    <input 
                      type="text" 
                      placeholder="Type your message..." 
                      value={inputMsg}
                      onChange={(e) => setInputMsg(e.target.value)}
                      disabled={!isConnected}
                    />
                    <button type="submit" disabled={!inputMsg.trim() || !isConnected}>
                      <Send size={18} />
                    </button>
                  </form>
                </>
              ) : (
                <div className="chat-placeholder">
                  <div className="chat-placeholder-icon"><MessageSquare size={48} /></div>
                  <h2>Your Messages</h2>
                  <p>Select a conversation from the sidebar to start chatting</p>
                </div>
              )}
            </div>
        </div>
      </div>

      {showMembersModal && activeGroup && (
        <Modal open={showMembersModal} onClose={() => setShowMembersModal(false)} title="Group Members" size="sm">
          <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 4 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeGroup.participants.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px', borderRadius: 8, background: 'var(--bg-elevated)' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--blue-muted)', color: 'var(--blue)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 'bold', overflow: 'hidden'
                  }}>
                    {p.avatar ? <img src={p.avatar} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : p.initials}
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
};
