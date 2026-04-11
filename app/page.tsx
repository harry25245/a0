"use client";
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// --- THE ALPHA TYPEWRITER COMPONENT ---
const AlphaTypewriter = ({ text, speed = 15 }: { text: string; speed?: number }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(i));
      i++;
      if (i >= text.length) {
        clearInterval(timer);
        setIsDone(true);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <div className="w-full">
      {isDone ? (
        <div className="prose prose-sm max-w-none transition-opacity duration-500 ease-in">
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {text}
          </ReactMarkdown>
        </div>
      ) : (
        <div className="font-mono text-sm text-gray-500 whitespace-pre-wrap leading-relaxed">
          {displayedText}
          <span className="inline-block w-2 h-4 ml-1 bg-gray-400 animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default function AlphaAI() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: string; content: string; id: number }[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [weather, setWeather] = useState('Locating...');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Dynamic Geolocation & Weather Fetch
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`)
            .then(res => res.json())
            .then(data => {
              const temp = Math.round(data.current_weather.temperature);
              setWeather(`${temp}°C & Local`);
            })
            .catch(() => setWeather("Weather Offline"));
        },
        () => setWeather("Location Denied")
      );
    } else {
      setWeather("No GPS Support");
    }
  }, []);

  // 2. Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const userMsg = { role: 'user', content: input, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg].map(({role, content}) => ({role, content})) }),
      });
      
      const data = await response.json();
      
      if (data.text) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.text, id: Date.now() + 1 }]);
      }
    } catch (error) {
      console.error("Alpha Error:", error);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-[#F9F9F8] text-[#212121] overflow-hidden font-sans">
      
      {/* HEADER */}
      <nav className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-[#F9F9F8] z-20">
        <div className="flex flex-col">
          <span className="text-xs font-black tracking-widest text-gray-800">ALPHA AI</span>
          <span className="text-[10px] text-green-600 font-medium uppercase tracking-tighter">System Active</span>
        </div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{weather}</span>
      </nav>

      {/* CHAT AREA */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-10 scroll-smooth"
      >
        <div className="max-w-2xl mx-auto w-full">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center opacity-30">
              <div className="w-12 h-12 bg-gray-200 rounded-full mb-4 animate-pulse" />
              <p className="text-sm font-medium italic">Ready when you are, Harry.</p>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`flex w-full mb-8 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`relative max-w-[95%] px-5 py-4 rounded-3xl transition-all duration-300 ${
                m.role === 'user' 
                  ? 'bg-[#ECECF1] text-sm shadow-sm' 
                  : 'bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl ring-1 ring-black/5 w-full'
              }`}>
                {m.role === 'user' ? (
                  <p className="leading-relaxed font-medium text-gray-800">{m.content}</p>
                ) : (
                  <div className="text-gray-900">
                    <AlphaTypewriter text={m.content} speed={12} />
                  </div>
                )}
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex justify-start items-center space-x-2 opacity-50 ml-4">
              <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" />
            </div>
          )}
        </div>
      </div>

      {/* INPUT AREA - Anchored to bottom */}
      <div className="shrink-0 p-4 bg-[#F9F9F8] border-t border-gray-100 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-2xl mx-auto relative group">
          <div className="relative flex items-center bg-white border border-gray-300 rounded-2xl shadow-sm transition-all focus-within:ring-1 focus-within:ring-gray-400 focus-within:border-gray-400">
            <textarea 
              rows={1}
              className="w-full py-4 pl-4 pr-12 bg-transparent resize-none focus:outline-none text-sm leading-tight"
              placeholder="What's on your mind?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button 
              onClick={handleSend}
              disabled={isThinking || !input.trim()}
              className={`absolute right-2 p-2 rounded-xl transition-all ${isThinking || !input.trim() ? 'text-gray-200' : 'text-black hover:bg-gray-100'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
              </svg>
            </button>
          </div>
          <p className="text-[9px] text-center mt-3 text-gray-400 font-medium uppercase tracking-widest">Alpha Personal Assistant v1.0</p>
        </div>
      </div>
    </div>
  );
}
