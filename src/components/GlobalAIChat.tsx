'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { usePathname } from 'next/navigation';
import { Bot, User, Send, Loader2, Sparkles, X, MessageSquarePlus } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

export default function GlobalAIChat() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      content: 'أهلاً بك يا مهندس. أنا المهندس أحمد شوقي. يمكنني مساعدتك في أي شيء يخص النظام أو مشاريعك. كيف يمكنني مساعدتك اليوم؟'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isThinking, isOpen]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsThinking(true);

    // Artificial delay to prevent hitting Gemini API rate limits (Free Tier)
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    setIsThinking(false);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          projectContext: {
            currentPage: pathname,
            header: currentProject?.header,
            boq: currentProject?.items?.map(item => ({ title: item.title, unit: item.unit, quantity: item.quantity })),
            inventory: currentProject?.inventory?.map(tx => ({ type: tx.type, item: tx.materialName, qty: tx.quantity, date: tx.date })),
            rfqs: currentProject?.rfqs?.map(rfq => ({ title: rfq.title, status: rfq.status, date: rfq.dueDate })),
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: data.reply
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: 'عذراً، حدث خطأ أثناء الاتصال بالخادم. حاول مرة أخرى.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-[9999] p-4 rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 transition-all transform hover:scale-110 ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
      >
        <Bot className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div className={`fixed md:bottom-6 md:right-6 bottom-0 right-0 z-[9999] w-full md:w-[400px] h-[85vh] md:h-[600px] md:max-w-[calc(100vw-48px)] md:max-h-[calc(100vh-48px)] bg-[#0d0e12] border border-[#222634] rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col font-cairo overflow-hidden transition-all duration-300 transform md:origin-bottom-right ${isOpen ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-full md:translate-y-0 md:scale-0 opacity-0 pointer-events-none'}`}>
        
        {/* Header */}
        <div className="flex justify-between items-center bg-[#13151c] p-4 border-b border-[#222634] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-900 border border-indigo-700 flex items-center justify-center text-indigo-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                المهندس أحمد شوقي
                <Sparkles className="w-3 h-3 text-indigo-400" />
              </h3>
              <p className="text-[10px] text-slate-400">مساعدك الذكي | Eng Assist</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#222634] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-[#0d0e12]">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex flex-shrink-0 items-center justify-center border shadow-xl ${
                msg.role === 'user' 
                  ? 'bg-emerald-900 border-emerald-700 text-emerald-400' 
                  : 'bg-indigo-900 border-indigo-700 text-indigo-400'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              
              <div className={`max-w-[80%] rounded-2xl p-3 text-[13px] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#1a1c24] border border-[#222634] text-slate-200 rounded-tr-sm'
                  : 'bg-[#13151c] border border-indigo-900/30 text-slate-300 rounded-tl-sm shadow-lg shadow-indigo-900/5 whitespace-pre-wrap'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex flex-shrink-0 items-center justify-center border shadow-xl bg-indigo-900 border-indigo-700 text-indigo-400">
                <Bot className="w-4 h-4" />
              </div>
              <div className="max-w-[80%] rounded-2xl p-3 bg-[#13151c] border border-indigo-900/30 text-indigo-400 rounded-tl-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-[10px] font-bold">المهندس أحمد يفكر...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer Input */}
        <div className="shrink-0 p-4 bg-[#13151c] border-t border-[#222634]">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب سؤالك هنا..."
              className="w-full bg-[#0d0e12] border border-[#222634] rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:border-indigo-500/50 focus:outline-none resize-none shadow-inner scrollbar-hide"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="absolute bottom-1.5 left-1.5 p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
