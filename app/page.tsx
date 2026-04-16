"use client";
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const AlphaTypewriter = ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
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
        if (onComplete) onComplete();
      }
    }, 12);
    return () => clearInterval(timer);
  }, [text, onComplete]);

  return (
    <div className="w-full">
      {isDone ? (
        <div className="prose prose-sm max-w-none text-gray-900">
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{text}</ReactMarkdown>
        </div>
      ) : (
        <div className="font-mono text-sm text-gray-500 whitespace-pre-wrap">{displayedText}<span className="inline-block w-2 h-4 ml-1 bg-gray-400 animate-pulse" /></div>
      )}
    </div>
  );
};

export default function AlphaAI() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: string; content: string; id: number }[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
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

  const speak = async (text: string) => {
    setIsSpeaking(true);
    const cleanText = text.replace(/[*#$]/g, '');
    try {
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText }),
      });
      const blob = await response.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audio.onended = () => setIsSpeaking(false);
      audio.play();
    } catch { setIsSpeaking(false); }
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
    <div className="fixed inset-0 flex flex-col bg-[#F9F9F8] text-[#212121] overflow-hidden">
      <nav className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-[#F9F9F8] z-20 font-bold">
        <div><span className="text-xs tracking-widest">ALPHA AI</span><span className="block text-[8px] text-green-600 uppercase tracking-tighter">System Active</span></div>
        <span className="text-[10px] text-gray-400">{weather}</span>
      </nav>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-10">
        <div className="max-w-2xl mx-auto w-full">
          {messages.map((m) => (
            <div key={m.id} className={`flex w-full mb-8 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`relative max-w-[95%] px-5 py-4 rounded-3xl transition-all duration-700 ${
                m.role === 'user' ? 'bg-[#ECECF1] text-sm shadow-sm' : 
                `bg-white/60 backdrop-blur-xl border shadow-xl ring-1 ring-black/5 w-full ${isSpeaking ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]' : 'border-white/40'}`
              }`}>
                {m.role === 'user' ? <p className="font-medium text-gray-800">{m.content}</p> : 
                <AlphaTypewriter text={m.content} onComplete={() => m.role === 'assistant' && speak(m.content)} />}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="shrink-0 p-4 bg-[#F9F9F8] border-t border-gray-100 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <button onClick={toggleListening} className={`p-4 rounded-2xl border transition-all ${isListening ? 'bg-red-100 border-red-200 text-red-600 animate-pulse' : 'bg-white border-gray-300 text-gray-500'}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          </button>
          <div className="relative flex-1 flex items-center bg-white border border-gray-300 rounded-2xl shadow-sm focus-within:ring-1 focus-within:ring-gray-400">
            <textarea rows={1} className="w-full py-4 pl-4 pr-12 bg-transparent resize-none focus:outline-none text-sm" placeholder={isListening ? "Listening..." : "Speak or type..."} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}/>
            <button onClick={handleSend} disabled={isThinking || !input.trim()} className="absolute right-2 p-2 text-black disabled:text-gray-200"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg></button>
          </div>
        </div>
        <p className="text-[9px] text-center mt-3 text-gray-400 font-medium uppercase tracking-widest italic">Personal Assistant v1.2 • Voice Enabled</p>
      </div>
    </div>
  );
}
