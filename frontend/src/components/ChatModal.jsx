import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Image as ImageIcon, Paperclip, Smile, Edit2, Trash2, Reply } from 'lucide-react';
import axios from '../utils/axios';
import socket from '../utils/socket';
import toast from 'react-hot-toast';
import Button from './ui/Button';
import Modal from './ui/Modal';
import Avatar from './ui/Avatar';
import Input from './ui/Input';
import EmojiPicker from 'emoji-picker-react';

const ChatModal = ({ isOpen, onClose, userId, userName, userPicture }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [isUserOnline, setIsUserOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchMessages();
      setupSocketListeners();
    }
    return () => {
      socket.off('message:receive');
      socket.off('typing:start');
      socket.off('typing:stop');
      socket.off('user:online');
      socket.off('user:offline');
    };
  }, [isOpen, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`/messages/conversation/${userId}`);
      setMessages(response.data.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const setupSocketListeners = () => {
    socket.on('message:receive', (message) => {
      if (message.sender_id === userId || message.receiver_id === userId) {
        setMessages(prev => [...prev, message]);
        // Mark messages as seen
        if (message.sender_id !== userId) {
          socket.emit('messages:seen', { sender_id: message.sender_id });
        }
      }
    });
    
    socket.on('typing:start', (data) => {
      if (data.user_id === userId) {
        setIsTyping(true);
      }
    });
    
    socket.on('typing:stop', (data) => {
      if (data.user_id === userId) {
        setIsTyping(false);
      }
    });
    
    socket.on('user:online', (data) => {
      if (data.userId === userId) {
        setIsUserOnline(true);
        setLastSeen(null);
      }
    });
    
    socket.on('user:offline', (data) => {
      if (data.userId === userId) {
        setIsUserOnline(false);
        setLastSeen(new Date());
      }
    });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setAttachment(file);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !attachment) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('receiver_id', userId);
      formData.append('content', newMessage);
      
      if (attachment) {
        formData.append('file', attachment);
      }
      
      if (replyingTo) {
        formData.append('reply_to', replyingTo.id);
      }
      
      if (editingMessage) {
        formData.append('message_id', editingMessage.id);
        const response = await axios.put('/messages', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setMessages(prev => prev.map(msg => 
          msg.id === editingMessage.id ? response.data.data : msg
        ));
        setEditingMessage(null);
      } else {
        const response = await axios.post('/messages', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setMessages(prev => [...prev, response.data.data]);
      }
      
      setNewMessage('');
      setAttachment(null);
      setReplyingTo(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setUploading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiClick = (emojiObject) => {
    setNewMessage(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const handleEditMessage = (message) => {
    setEditingMessage(message);
    setNewMessage(message.content);
    setReplyingTo(null);
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await axios.delete(`/messages/${messageId}`);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      toast.success('Message deleted');
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const handleReplyMessage = (message) => {
    setReplyingTo(message);
    setEditingMessage(null);
    document.querySelector('input[type="text"]')?.focus();
  };

  const handleTypingStart = () => {
    if (!isTyping) {
      socket.emit('typing:start', { receiver_id: userId });
      setIsTyping(true);
    }
    
    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set new timeout to stop typing after 3 seconds
    const timeout = setTimeout(() => {
      socket.emit('typing:stop', { receiver_id: userId });
      setIsTyping(false);
    }, 3000);
    
    setTypingTimeout(timeout);
  };

  const handleTypingStop = () => {
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    socket.emit('typing:stop', { receiver_id: userId });
    setIsTyping(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Chat with ${userName}`}>
      <div className="flex flex-col h-[500px]">
        {/* Online Status */}
        <div className="flex items-center justify-between mb-2 px-4">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isUserOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isUserOnline ? 'Online' : lastSeen ? `Last seen ${lastSeen.toLocaleTimeString()}` : 'Offline'}
            </span>
          </div>
        </div>
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === userId ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`flex items-start space-x-2 max-w-[70%] ${
                  message.sender_id === userId ? 'flex-row' : 'flex-row-reverse space-x-reverse'
                }`}>
                  <Avatar
                    src={message.sender_id === userId ? userPicture : undefined}
                    alt={message.sender_id === userId ? userName : 'You'}
                    fallback={message.sender_id === userId ? userName?.charAt(0) : 'Y'}
                    size="sm"
                  />
                  <div className={`p-3 rounded-lg relative group ${
                    message.sender_id === userId
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                      : 'bg-primary-600 text-white'
                  }`}>
                    {message.reply_to && (
                      <div className="text-xs opacity-70 mb-1 p-2 bg-gray-100 dark:bg-gray-600 rounded">
                        <Reply className="inline h-3 w-3 mr-1" />
                        Replying to {message.reply_to.sender_name}: {message.reply_to.content?.substring(0, 50)}...
                      </div>
                    )}
                    {message.content && (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                    {message.file_url && (
                      <div className="mt-2">
                        {message.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img
                            src={message.file_url}
                            alt="Attachment"
                            className="max-w-full h-auto rounded"
                          />
                        ) : (
                          <a
                            href={message.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            📎 {message.file_name || 'Attachment'}
                          </a>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs opacity-70">
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {message.status === 'delivered' && (
                          <span className="ml-1">✓</span>
                        )}
                        {message.status === 'seen' && (
                          <span className="ml-1">✓✓</span>
                        )}
                      </p>
                      {message.sender_id !== userId && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleReplyMessage(message)}
                          >
                            <Reply className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      {message.sender_id === userId && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleEditMessage(message)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleDeleteMessage(message.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          {isTyping && (
            <div className="text-xs text-gray-500 italic">
              {userName} is typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="space-y-2">
          {replyingTo && (
            <div className="flex items-center justify-between p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <div className="flex items-center space-x-2">
                <Reply className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Replying to {replyingTo.sender_name}: {replyingTo.content?.substring(0, 30)}...</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setReplyingTo(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          {attachment && (
            <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <span className="text-sm truncate">{attachment.name}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAttachment(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={(input) => {
                if (input) {
                  input.setAttribute('hidden', 'true');
                }
              }}
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => document.querySelector('input[type="file"]').click()}
              disabled={uploading}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={uploading}
              >
                <Smile className="h-4 w-4" />
              </Button>
              {showEmojiPicker && (
                <div className="absolute bottom-10 left-0 z-50">
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    theme="auto"
                  />
                </div>
              )}
            </div>
            <Input
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                if (e.target.value.trim()) {
                  handleTypingStart();
                } else {
                  handleTypingStop();
                }
              }}
              onKeyPress={handleKeyPress}
              onBlur={handleTypingStop}
              placeholder={editingMessage ? "Edit message..." : "Type a message..."}
              disabled={uploading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={uploading || (!newMessage.trim() && !attachment)}
            >
              {editingMessage ? <Edit2 className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ChatModal;
