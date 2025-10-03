import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const AISupportChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEscalation, setShowEscalation] = useState(false);
  const messagesEndRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initial greeting
      sendMessage('');
    }
  }, [isOpen]);
  
  const sendMessage = async (text) => {
    const messageText = text || inputMessage.trim();
    
    if (!messageText && messages.length > 0) return;
    
    // Add user message
    if (messageText && messages.length > 0) {
      setMessages(prev => [...prev, {
        type: 'user',
        text: messageText,
        timestamp: new Date()
      }]);
      setInputMessage('');
    }
    
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${BACKEND_URL}/api/support/chat`,
        { message: messageText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const data = response.data;
      
      // Add AI response
      setMessages(prev => [...prev, {
        type: 'ai',
        ...data,
        timestamp: new Date()
      }]);
      
      // Show escalation option if needed
      if (data.type === 'escalation' && data.can_escalate) {
        setShowEscalation(true);
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
    sendMessage(suggestion);
  };
  
  const handleEscalateToTicket = async () => {
    try {
      const token = localStorage.getItem('token');
      const lastUserMessage = messages.filter(m => m.type === 'user').pop();
      
      await axios.post(
        `${BACKEND_URL}/api/support/tickets`,
        {
          subject: 'Support Request from AI Chat',
          message: lastUserMessage?.text || 'Need help from support team',
          source: 'ai_escalation',
          priority: 'medium'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Tiket support berhasil dibuat! Tim kami akan membantu dalam 1x24 jam.');
      setShowEscalation(false);
      setMessages(prev => [...prev, {
        type: 'ai',
        message: '✅ Tiket support berhasil dibuat! Tim support kami akan segera membantu Anda. Anda akan menerima notifikasi saat ada update.',
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Escalation error:', error);
      toast.error('Failed to create support ticket');
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage('');
    }
  };
  
  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-shadow"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              AI
            </span>
          </motion.button>
        )}
      </AnimatePresence>
      
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-violet-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <div>
                  <h3 className="font-semibold">AI Support Assistant</h3>
                  <p className="text-xs opacity-90">Powered by HostingIn</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.type === 'ai' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full flex items-center justify-center mr-2">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 ${
                      msg.type === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.message || msg.text}</p>
                    
                    {/* Suggestions */}
                    {msg.type === 'ai' && msg.suggestions && (
                      <div className="mt-3 space-y-2">
                        {msg.suggestions.map((suggestion, i) => (
                          <button
                            key={i}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full text-left text-sm px-3 py-2 bg-blue-50 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-gray-600 rounded-lg transition"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Escalation Button */}
                    {msg.type === 'ai' && msg.can_escalate && showEscalation && (
                      <button
                        onClick={handleEscalateToTicket}
                        className="mt-3 w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Buat Tiket Support</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full flex items-center justify-center mr-2">
                    <Sparkles className="w-4 h-4 text-white animate-pulse" />
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ketik pesan Anda..."
                  className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={() => sendMessage('')}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-gradient-to-r from-blue-600 to-violet-600 text-white p-2 rounded-xl hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AISupportChat;
