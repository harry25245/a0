"use client";
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function AlphaAI() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [weather, setWeather] = useState('Loading weather...');

  // 1. Fetch Weather (Pimpri-Chinchwad)
  useEffect(() => {
    fetch("https://api.open-meteo.com/v1/forecast?latitude=18.62&longitude=73.80&current_weather=true")
      .then(res => res.json())
      .then(data => setWeather(`${data.current_weather.temperature}°C & Clear`));
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, newMsg]);
    setInput('');

    // Calling our internal API (Step 4)
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [...messages, newMsg] }),
    });
    const data = await response.json();
    setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
  };

  return (
    <div className="flex flex-col h-screen bg-[#F9F9F8] text-[#212121]">
      {/* Header */}
      <nav className="p-4 border-b flex justify-between text-xs font-medium text-gray-500">
        <span>ALPHA AI</span>
        <span>{weather}</span>
      </nav>

      {/* Chat Space */}
      <div className="flex-1 overflow-y-auto p-4 space-y-8 max-w-2xl mx-auto w-full">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] ${m.role === 'user' ? 'bg-[#ECECF1] p-3 rounded-2xl text-sm' : 'text-md leading-relaxed w-full'}`}>
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {m.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-4 max-w-2xl mx-auto w-full mb-4">
        <div className="relative flex items-center border border-gray-300 rounded-2xl bg-white shadow-sm focus-within:ring-1 ring-gray-400">
          <textarea 
            rows={1}
            className="w-full p-4 bg-transparent resize-none focus:outline-none"
            placeholder="Ask anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
          />
          <button onClick={handleSend} className="p-3 mr-1 text-gray-400 hover:text-black">↑</button>
        </div>
      </div>
    </div>
  );
}

