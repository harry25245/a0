"use client";
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// --- THE ALPHA STREAMING COMPONENT ---
const AlphaStreamer = ({ text, onSpeakToggle }: { text: string; onSpeakToggle: () => void }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(timer);
        setIsDone(true);
      }
    }, 10); // Faster typing speed
    return () => clearInterval(timer);
  }, [text]);

  return (
    <div className="relative group">
      {/* SPEAKER BUTTON - Top Right */}
      <button 
        onClick={onSpeakToggle}
        className="absolute -top-2 -right-2 p-1.5 bg-white rounded-full shadow-md border border-gray-100 hover:bg-gray-50 transition-all z-10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
        </svg>
      </button>

      <div className="prose prose-sm max-w-none text-gray-900 transition-all duration-300">
        <ReactMarkdown 
          remarkPlugins={[remarkMath]} 
          rehypePlugins={[rehypeKatex]}
          components={{
            // Fade-in animation for LaTeX blocks
            math: ({value}) => <div className="animate-in fade-in duration-700 my-2">{value}</div>,
            inlineMath: ({value}) => <span className="animate-in fade-in duration-500 font-bold">{value}</span>
          }}
        >
          {displayedText}
        </ReactMarkdown>
        {!isDone && <span className="inline-block w-1.5 h-4 ml-1 bg-cyan-400 animate-pulse" />}
      </div>
    </div>
  );
};

export default function AlphaAI() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: string; content: string; id: number }[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);
  const [weather, setWeather] = useState('Locating...');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&current_weather=true`)
          .then(res => res.json())
          .then(data => setWeather(`${Math.round(data.current_weather.temperature)}°C & Local`));
      });
    }
  }, []);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, isThinking]);

  const handleVoiceToggle = async (text: string) => {
    // If already playing, stop it
    if (activeAudio) {
      activeAudio.pause();
      setActiveAudio(null);
      return;
    }

    const cleanText = text.replace(/[*#$]/g, '');
    try {
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText }),
      });
      const blob = await response.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      setActiveAudio(audio);
      audio.onended = () => setActiveAudio(null);
      audio.play();
    } catch { setActiveAudio(null); }
  };

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e: any) => setInput(e.results[0][0].transcript);
    isListening ? recognition.stop() : recognition.start();
  };

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
      if (data.text) setMessages(prev => [...prev, { role: 'assistant', content: data.text, id: Date.now() + 1 }]);
    } finally { setIsThinking(false); }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-[#F9F9F8] text-[#212121] overflow-hidden font-sans">
      <nav className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-[#F9F9F8] z-20">
        <div className="flex flex-col">
          <span className="text-xs font-black tracking-widest">ALPHA AI</span>
          <span className="text-[10px] text-green-600 font-medium uppercase tracking-tighter italic">Voice Enabled</span>
        </div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{weather}</span>
      </nav>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-10 scroll-smooth">
        <div className="max-w-2xl mx-auto w-full">
          {messages.map((m) => (
            <div key={m.id} className={`flex w-full mb-8 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`relative max-w-[95%] px-5 py-4 rounded-3xl transition-all duration-500 ${
                m.role === 'user' ? 'bg-[#ECECF1] text-sm shadow-sm' : 
                `bg-white/60 backdrop-blur-xl border shadow-xl ring-1 ring-black/5 w-full ${activeAudio ? 'border-cyan-400 ring-cyan-200/50 shadow-[0_0_20px_rgba(34,211,238,0.2)]' : 'border-white/40'}`
              }`}>
                {m.role === 'user' ? <p className="font-medium text-gray-800 leading-relaxed">{m.content}</p> : 
                <AlphaStreamer text={m.content} onSpeakToggle={() => handleVoiceToggle(m.content)} />}
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex justify-start items-center space-x-2 opacity-50 ml-4 animate-pulse">
              <div className="w-1.5 h-1.5 bg-black rounded-full" />
              <div className="w-1.5 h-1.5 bg-black rounded-full" />
              <div className="w-1.5 h-1.5 bg-black rounded-full" />
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 p-4 bg-[#F9F9F8] border-t border-gray-100 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <button onClick={toggleListening} className={`p-4 rounded-2xl border transition-all ${isListening ? 'bg-red-100 border-red-200 text-red-600 animate-pulse' : 'bg-white border-gray-300 text-gray-500'}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          </button>
          <div className="relative flex-1 flex items-center bg-white border border-gray-300 rounded-2xl shadow-sm focus-within:ring-1 focus-within:ring-gray-400">
            <textarea rows={1} className="w-full py-4 pl-4 pr-12 bg-transparent resize-none focus:outline-none text-sm" placeholder={isListening ? "Listening..." : "Speak or type..."} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}/>
            <button onClick={handleSend} disabled={isThinking || !input.trim()} className="absolute right-2 p-2 text-black disabled:text-gray-200">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
