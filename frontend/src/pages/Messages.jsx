import React, { useState, useEffect, useRef } from 'react';
import { Search, MoreVertical, Send, Paperclip, Bell, BellOff, Users, Plus, ArrowLeft, Trash2 } from 'lucide-react';
import axios from '../utils/axios';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';
import socket from '../utils/socket';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Avatar from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Textarea from '../components/ui/Textarea';
import { getMediaUrl } from '../utils/api';

const Messages = () => {
  const user = useAuthStore((state) => state.user);
  const { selectedChat, chats, messages, typingUsers, setSelectedChat, setChats, setMessages, addMessage, addTypingUser, removeTypingUser } = useChatStore();
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typing, setTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showChatOptions, setShowChatOptions] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [lastSeen, setLastSeen] = useState({});
  const messagesEndRef = useRef(null);
  
  // Group chat states
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [showGroupOptions, setShowGroupOptions] = useState(null);
  const [friends, setFriends] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showMemberSelection, setShowMemberSelection] = useState(false);
  const [showMobileConversation, setShowMobileConversation] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchChats();
    fetchGroups();
    fetchFriends();
  }, []);

  const fetchChats = async () => {
    try {
      console.log('Fetching chats...');
      const response = await axios.get('/chats');
      console.log('Chats response:', response.data);
      setChats(response.data.data || []);
    } catch (error) {
      console.error('Fetch chats error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch chats');
    }
  };

  const fetchGroups = async () => {
    try {
      console.log('Fetching groups...');
      const response = await axios.get('/groups/my');
      console.log('Groups response:', response.data);
      setGroups(response.data.data || []);
    } catch (error) {
      console.error('Fetch groups error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch groups');
    }
  };

  const fetchFriends = async () => {
    try {
      console.log('Fetching friends...');
      const response = await axios.get('/friends');
      console.log('Friends response:', response.data);
      setFriends(response.data.data || []);
    } catch (error) {
      console.error('Fetch friends error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch friends');
    }
  };

  const fetchGroupMessages = async () => {
    if (!selectedGroup) return;
    try {
      const response = await axios.get(`/messages/group/${selectedGroup.id}`);
      setGroupMessages(response.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch group messages');
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Group name is required');
      return;
    }

    try {
      const response = await axios.post('/groups', {
        name: groupName,
        description: groupDescription,
        is_private: false
      });
      
      const groupId = response.data.data.id;
      
      // Add selected members to the group
      if (selectedMembers.length > 0) {
        await Promise.all(
          selectedMembers.map(memberId =>
            axios.post(`/groups/${groupId}/members`, {
              user_id: memberId,
              role: 'member'
            })
          )
        );
      }
      
      toast.success('Group created successfully');
      setShowCreateGroup(false);
      setShowMemberSelection(false);
      setGroupName('');
      setGroupDescription('');
      setSelectedMembers([]);
      fetchGroups();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create group');
    }
  };

  const handleMemberToggle = (friendId) => {
    setSelectedMembers(prev => 
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleDeleteGroup = async (groupId) => {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/groups/${groupId}`);
      toast.success('Group deleted successfully');
      setShowGroupOptions(null);
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
        setIsGroupMode(false);
      }
      fetchGroups();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete group');
    }
  };

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    setSelectedChat(null);
    setIsGroupMode(true);
    fetchGroupMessages();
    socket.emit('group:join', group.id);
    setShowMobileConversation(true);
  };

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    setSelectedGroup(null);
    setIsGroupMode(false);
    if (selectedGroup) {
      socket.emit('group:leave', selectedGroup.id);
    }
    setShowMobileConversation(true);
  };

  const handleMuteChat = async (chatId) => {
    try {
      await axios.put(`/chats/${chatId}/mute`);
      toast.success('Chat muted');
      fetchChats();
      setShowChatOptions(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mute chat');
    }
  };

  const handleUnmuteChat = async (chatId) => {
    try {
      await axios.put(`/chats/${chatId}/unmute`);
      toast.success('Chat unmuted');
      fetchChats();
      setShowChatOptions(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to unmute chat');
    }
  };

  const fetchMessages = async () => {
    if (!selectedChat) return;
    try {
      const response = await axios.get(`/messages/conversation/${selectedChat.other_user_id}`);
      setMessages(response.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch messages');
    }
  };

  useEffect(() => {
    if (selectedChat) {
      fetchMessages();
      socket.emit('chat:join', selectedChat.id);
    }

    return () => {
      if (selectedChat) {
        socket.emit('chat:leave', selectedChat.id);
      }
    };
  }, [selectedChat]);

  useEffect(() => {
    socket.on('message:receive', (message) => {
      // Handle private messages
      if (selectedChat && (message.sender_id === selectedChat.other_user_id || message.receiver_id === selectedChat.other_user_id)) {
        addMessage(message);
        // Mark messages as seen
        if (message.sender_id !== user.id) {
          socket.emit('messages:seen', { sender_id: message.sender_id });
        }
      }
      // Handle group messages
      if (selectedGroup && message.group_id === selectedGroup.id) {
        setGroupMessages(prev => [...prev, message]);
      }
    });

    socket.on('typing:start', ({ user_id, group_id }) => {
      if (group_id && selectedGroup?.id === group_id) {
        addTypingUser(user_id);
      } else if (user_id === selectedChat?.other_user_id) {
        addTypingUser(user_id);
      }
    });

    socket.on('typing:stop', ({ user_id, group_id }) => {
      if (group_id && selectedGroup?.id === group_id) {
        removeTypingUser(user_id);
      } else {
        removeTypingUser(user_id);
      }
    });

    socket.on('user:online', ({ userId }) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
      setLastSeen(prev => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
    });

    socket.on('user:offline', ({ userId }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      setLastSeen(prev => ({
        ...prev,
        [userId]: new Date()
      }));
    });

    socket.on('messages:seen', ({ userId }) => {
      // Update message status to seen
      setMessages(prev => prev.map(msg => 
        msg.sender_id === user.id && msg.receiver_id === userId 
          ? { ...msg, delivery_status: 'seen' }
          : msg
      ));
    });

    return () => {
      socket.off('message:receive');
      socket.off('typing:start');
      socket.off('typing:stop');
      socket.off('user:online');
      socket.off('user:offline');
      socket.off('messages:seen');
    };
  }, [selectedChat, selectedGroup, user.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, groupMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    try {
      if (isGroupMode && selectedGroup) {
        // Send group message
        const response = await axios.post('/messages', {
          group_id: selectedGroup.id,
          content: messageInput
        });
        setGroupMessages(prev => [...prev, response.data.data]);
      } else if (selectedChat) {
        // Send private message
        const response = await axios.post('/messages', {
          receiver_id: selectedChat.other_user_id,
          content: messageInput
        });
        addMessage(response.data.data);
      }
      setMessageInput('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploadType', 'message');
    if (isGroupMode && selectedGroup) {
      formData.append('group_id', selectedGroup.id);
    } else if (selectedChat) {
      formData.append('receiver_id', selectedChat.other_user_id);
    } else {
      toast.error('Please select a chat first');
      return;
    }
    formData.append('content', ''); // Add empty content for file-only messages

    setUploading(true);
    try {
      const response = await axios.post('/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (isGroupMode) {
        setGroupMessages(prev => [...prev, response.data.data]);
      } else {
        addMessage(response.data.data);
      }
      toast.success('File sent successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send file');
    } finally {
      setUploading(false);
    }
  };

  const handleTyping = () => {
    if (!typing) {
      setTyping(true);
      socket.emit('typing:start', { receiver_id: selectedChat?.other_user_id });
    }
  };

  const handleStopTyping = () => {
    if (typing) {
      setTyping(false);
      socket.emit('typing:stop', { receiver_id: selectedChat?.other_user_id });
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.other_username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.other_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter(group =>
    group.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeMessages = isGroupMode ? groupMessages : messages;
  const selectedTitle = isGroupMode ? selectedGroup?.name : selectedChat?.other_name;
  const selectedSubtitle = isGroupMode
    ? `${selectedGroup?.member_count || 0} members`
    : onlineUsers.has(selectedChat?.other_user_id)
      ? 'Online'
      : lastSeen[selectedChat?.other_user_id]
        ? `Last seen ${new Date(lastSeen[selectedChat?.other_user_id]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : 'Offline';

  const formatMessageTime = (value) => (
    value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
  );

  const handleDeleteMessage = async (messageId) => {
    try {
      await axios.delete(`/messages/${messageId}`);
      if (isGroupMode) {
        setGroupMessages(prev => prev.filter(message => message.id !== messageId));
      } else {
        setMessages(messages.filter(message => message.id !== messageId));
      }
      toast.success('Message deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete message');
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] lg:h-screen bg-gray-100 dark:bg-gray-900">
      {/* Chat List */}
      <div className={`${showMobileConversation ? 'hidden md:flex' : 'flex'} w-full md:w-[360px] md:min-w-[360px] md:max-w-[360px] border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-col`}>
        <div className="px-4 pt-4 pb-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Chats</h1>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setShowCreateGroup(true)} className="w-full rounded-xl" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Create New Group
          </Button>
        </div>
        <div className="overflow-y-auto flex-1">
          {/* Groups Section */}
          {filteredGroups.length > 0 && (
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Groups
              </div>
              {filteredGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => handleSelectGroup(group)}
                  className={`w-full p-3.5 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    selectedGroup?.id === group.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="relative">
                    <Avatar
                      src={group.group_picture}
                      alt={group.name}
                      fallback={group.name?.charAt(0)}
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center">
                      <Users className="h-2 w-2 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold truncate">{group.name}</p>
                        <span className="text-xs text-gray-500">{group.member_count} members</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowGroupOptions(showGroupOptions === group.id ? null : group.id);
                            }}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                          {showGroupOptions === group.id && (
                            <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                              <div className="py-1">
                                {group.created_by === user.id && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start px-4 py-2 text-red-600 hover:text-red-700"
                                    onClick={() => handleDeleteGroup(group.id)}
                                  >
                                    Delete Group
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500 truncate">{group.description || 'No description'}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {/* Private Chats Section */}
          <div>
              {filteredGroups.length > 0 && (
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Direct Messages
              </div>
            )}
            {filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => handleSelectChat(chat)}
                className={`w-full p-3.5 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  selectedChat?.id === chat.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <Avatar
                  src={chat.other_picture}
                  alt={chat.other_name}
                  fallback={chat.other_name?.charAt(0)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold truncate">{chat.other_name}</p>
                      {chat.is_muted && <BellOff className="h-4 w-4 text-gray-400" />}
                    </div>
                    <div className="flex items-center space-x-2">
                      {chat.last_message_time && (
                        <span className="text-xs text-gray-500">{formatMessageTime(chat.last_message_time)}</span>
                      )}
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowChatOptions(showChatOptions === chat.id ? null : chat.id);
                          }}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                        {showChatOptions === chat.id && (
                          <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                            <div className="py-1">
                              {chat.is_muted ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start px-4 py-2"
                                  onClick={() => handleUnmuteChat(chat.id)}
                                >
                                  <Bell className="h-4 w-4 mr-2" />
                                  Unmute
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start px-4 py-2"
                                  onClick={() => handleMuteChat(chat.id)}
                                >
                                  <BellOff className="h-4 w-4 mr-2" />
                                  Mute
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 truncate">{chat.last_message}</p>
                    {chat.unread_count > 0 && (
                      <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                        {chat.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Window */}
      <div className={`${showMobileConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
        {(selectedChat || selectedGroup) ? (
          <>
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-9 w-9"
                  onClick={() => setShowMobileConversation(false)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                {isGroupMode ? (
                  <>
                    <div className="relative">
                      <Avatar
                        src={selectedGroup.group_picture}
                        alt={selectedGroup.name}
                        fallback={selectedGroup.name?.charAt(0)}
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center">
                        <Users className="h-2 w-2 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold">{selectedGroup.name}</p>
                      <p className="text-sm text-gray-500">{selectedGroup.member_count} members</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Avatar
                      src={selectedChat.other_picture}
                      alt={selectedChat.other_name}
                      fallback={selectedChat.other_name?.charAt(0)}
                    />
                    <div>
                      <p className="font-semibold">{selectedChat.other_name}</p>
                      <p className="text-sm">
                        {onlineUsers.has(selectedChat.other_user_id) ? (
                          <span className="text-green-500">Online</span>
                        ) : (
                          <span className="text-gray-500">
                            {lastSeen[selectedChat.other_user_id] 
                              ? `Last seen ${new Date(lastSeen[selectedChat.other_user_id]).toLocaleTimeString()}`
                              : 'Offline'
                            }
                          </span>
                        )}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
              {activeMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex flex-col">
                    <div
                      className={`max-w-[85%] md:max-w-xl px-4 py-2.5 rounded-2xl shadow-sm ${
                        message.sender_id === user.id
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
                      }`}
                    >
                      {isGroupMode && message.sender_id !== user.id && (
                        <p className="text-xs font-semibold mb-1">{message.sender_name || 'Unknown'}</p>
                      )}
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      {message.file_url && (
                        <div className="mt-2">
                          {message.file_url.match(/\.(jpg|jpeg|png|gif|webp|heic|heif)$/i) ? (
                            <img
                              src={getMediaUrl(message.file_url)}
                              alt={message.file_name || 'Attachment'}
                              className="rounded-lg max-h-64 w-auto"
                            />
                          ) : message.file_url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                            <video
                              src={getMediaUrl(message.file_url)}
                              controls
                              className="rounded-lg max-h-64 w-auto"
                            />
                          ) : (
                            <a
                              href={getMediaUrl(message.file_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`text-sm underline ${message.sender_id === user.id ? 'text-blue-100' : 'text-blue-600'}`}
                            >
                              {message.file_name || 'Open attachment'}
                            </a>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs opacity-70">
                            {formatMessageTime(message.created_at)}
                          </p>
                          {message.sender_id === user.id && (
                            <span className="text-xs">
                              {message.delivery_status === 'seen' ? '✓✓' : 
                               message.delivery_status === 'delivered' ? '✓' : ''}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-70 hover:opacity-100"
                          onClick={() => handleDeleteMessage(message.id)}
                          title="Delete message"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {message.sender_id === user.id && (
                      <div className="flex justify-end mt-1 pr-1">
                        <Avatar
                          src={user?.profile_picture}
                          alt={user?.full_name}
                          fallback={user?.full_name?.charAt(0)}
                          size="sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {typingUsers.length > 0 && !isGroupMode && (
                <div className="text-xs text-gray-500 italic">
                  {selectedChat.other_name} is typing...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3.5 md:p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-900 rounded-2xl px-2 py-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  hidden
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleTyping}
                  onKeyUp={handleStopTyping}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  disabled={uploading}
                />
                <Button onClick={handleSendMessage} disabled={uploading} className="rounded-full h-9 w-9 p-0 shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-6">
            <div className="text-center text-gray-500 max-w-sm">
              <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Send className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">Welcome to Messages</p>
              <p>Select a conversation from the left to start chatting instantly.</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      <Modal isOpen={showCreateGroup} onClose={() => setShowCreateGroup(false)} title="Create New Group">
        {!showMemberSelection ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Group Name</label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description (Optional)</label>
              <Textarea
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Enter group description"
                className="w-full"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateGroup(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => setShowMemberSelection(true)}
                disabled={!groupName.trim()}
              >
                Next: Add Members
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Add Members</h3>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {friends.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No friends available to add</p>
                ) : (
                  friends.map((friend) => (
                    <div key={friend.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                      <div className="flex items-center space-x-3">
                        <Avatar
                          src={friend.profile_picture}
                          alt={friend.full_name}
                          fallback={friend.full_name?.charAt(0)}
                        />
                        <span className="font-medium">{friend.full_name}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(friend.id)}
                        onChange={() => handleMemberToggle(friend.id)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => setShowMemberSelection(false)}
              >
                Back
              </Button>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateGroup(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateGroup}
                >
                  Create Group {selectedMembers.length > 0 && `(${selectedMembers.length} members)`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Messages;
