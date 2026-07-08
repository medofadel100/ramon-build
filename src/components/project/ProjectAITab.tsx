'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { Bot, User, Send, Loader2, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

export default function ProjectAITab() {
  const currentProject = useProjectStore((state) => state.currentProject);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      content: 'أهلاً بك يا مهندس. أنا المهندس أحمد شوقي، استشاري المشروع الخاص بك. يمكنني مساعدتك في أي شيء يخص التخطيط، المقايسات، الإدارة، أو حتى استلام الأعمال. كيف يمكنني مساعدتك اليوم؟'
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
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsThinking(true);

    // Artificial delay to prevent hitting Gemini API rate limits (Free Tier)
    // Wait for 5 seconds to simulate deep "thinking" and rate limit buffering
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    setIsThinking(false);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          projectContext: {
            header: currentProject?.header,
            boq: currentProject?.boq?.map(item => ({ name: item.name, unit: item.unit, quantity: item.quantity, price: item.price, total: item.total })),
            inventory: currentProject?.inventory?.map(tx => ({ type: tx.type, item: tx.itemName, qty: tx.quantity, date: tx.date })),
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
    <div className="flex flex-col h-[calc(100vh-200px)] animate-in fade-in slide-in-from-bottom-4 duration-500 font-cairo">
      
      <div className="flex justify-between items-center border-b border-[#222634] pb-4 shrink-0">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Bot className="h-5 w-5 text-indigo-400" />
            المساعد الهندسي الذكي
          </h3>
          <p className="text-xs text-slate-400 mt-1">المهندس أحمد شوقي - خبير واستشاري الإدارة الهندسية.</p>
        </div>
        <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] text-indigo-400 font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-500/5">
          <Sparkles className="w-3 h-3" /> مدعوم بتقنية Gemini
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 space-y-6 scrollbar-hide bg-[#0d0e12]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex flex-shrink-0 items-center justify-center border shadow-xl ${
              msg.role === 'user' 
                ? 'bg-emerald-900 border-emerald-700 text-emerald-400' 
                : 'bg-indigo-900 border-indigo-700 text-indigo-400'
            }`}>
              {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            
            <div className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-[#1a1c24] border border-[#222634] text-slate-200 rounded-tr-sm'
                : 'bg-[#13151c] border border-indigo-900/30 text-slate-300 rounded-tl-sm shadow-lg shadow-indigo-900/5 whitespace-pre-wrap'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full flex flex-shrink-0 items-center justify-center border shadow-xl bg-indigo-900 border-indigo-700 text-indigo-400">
              <Bot className="w-5 h-5" />
            </div>
            <div className="max-w-[80%] rounded-2xl p-4 bg-[#13151c] border border-indigo-900/30 text-indigo-400 rounded-tl-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs font-bold">المهندس أحمد شوقي يراجع المواصفات والمخططات...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 pt-4 bg-[#0d0e12]">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اسأل المهندس أحمد عن تفاصيل المشروع أو اطلب استشارته الهندسية..."
            className="w-full bg-[#1a1c24] border border-[#222634] rounded-xl pl-14 pr-4 py-4 text-sm text-white focus:border-indigo-500/50 focus:outline-none resize-none shadow-xl"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="absolute bottom-4 left-4 p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-500 mt-2">نظراً لدقة المراجعات، قد يستغرق المهندس أحمد شوقي عدة ثوانٍ قبل الرد.</p>
      </div>

    </div>
  );
}
