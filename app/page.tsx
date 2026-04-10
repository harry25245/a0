"use client";
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import 'katex/dist/katex.min.css';

export default function AlphaAI() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const newMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: [...messages, newMsg] }),
      });
      const data = await response.json();
      
      // Add a small delay to simulate thinking, then add the assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
    } catch (error) {
      console.error("Failed to send:", error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#F9F9F8] text-[#212121] overflow-hidden">
      {/* Header - Fixed height */}
      <nav className="h-14 border-b flex items-center justify-between px-6 text-xs font-bold text-gray-400 bg-[#F9F9F8] z-10">
        <span>ALPHA AI</span>
        <span className="text-green-500">ONLINE</span>
      </nav>

      {/* Chat Space - Calculated height to prevent scrolling outside this box */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-8 max-w-2xl mx-auto w-full scroll-smooth"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] ${m.role === 'user' ? 'bg-[#ECECF1] p-3 rounded-2xl text-sm' : 'text-md leading-relaxed w-full'}`}>
              <ReactMarkdown>{m.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        
        {/* The Typing Indicator (Cursor Animation) */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="w-2 h-5 bg-gray-400 animate-pulse rounded-full ml-1" />
          </div>
        )}
      </div>

      {/* Input Bar - Stay at bottom */}
      <div className="p-4 max-w-2xl mx-auto w-full bg-[#F9F9F8]">
        <div className="relative flex items-center border border-gray-300 rounded-2xl bg-white shadow-sm focus-within:ring-1 ring-gray-400">
          <textarea 
            rows={1}
            className="w-full p-4 bg-transparent resize-none focus:outline-none text-sm"
            placeholder="Ask Alpha anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
          />
          <button onClick={handleSend} className="p-3 mr-1 text-gray-400 hover:text-black transition-colors">
            ↑
          </button>
        </div>
        <p className="text-[10px] text-center mt-2 text-gray-400">Alpha can make mistakes. Check important info.</p>
      </div>
    </div>
  );
}
