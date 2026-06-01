import { create } from 'zustand';

const useChatStore = create((set) => ({
  selectedChat: null,
  chats: [],
  messages: [],
  typingUsers: [],
  
  setSelectedChat: (chat) => set({ selectedChat: chat }),
  
  setChats: (chats) => set({ chats }),
  
  addChat: (chat) => set((state) => ({ chats: [chat, ...state.chats] })),
  
  updateChat: (chatId, updates) => set((state) => ({
    chats: state.chats.map((chat) =>
      chat.id === chatId ? { ...chat, ...updates } : chat
    ),
  })),
  
  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  
  updateMessage: (messageId, updates) => set((state) => ({
    messages: state.messages.map((msg) =>
      msg.id === messageId ? { ...msg, ...updates } : msg
    ),
  })),
  
  setTypingUsers: (users) => set({ typingUsers: users }),
  
  addTypingUser: (userId) => set((state) => ({
    typingUsers: [...state.typingUsers, userId],
  })),
  
  removeTypingUser: (userId) => set((state) => ({
    typingUsers: state.typingUsers.filter((id) => id !== userId),
  })),
  
  clearChat: () => set({ selectedChat: null, messages: [], typingUsers: [] }),
}));

export default useChatStore;
