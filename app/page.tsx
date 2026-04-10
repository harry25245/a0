"use client";
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// --- THE ALPHA TYPEWRITER COMPONENT ---
const AlphaTypewriter = ({ text, speed = 20, onFinished }: { text: string, speed?: number, onFinished?: () => void }) => {
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
        if (onFinished) onFinished();
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <div className="alpha-response">
      {isDone ? (
        // RENDERED VERSION (Latex converted)
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
          {text}
        </ReactMarkdown>
      ) : (
        // TYPING VERSION (Raw code with cursor)
        <div className="font-mono text-sm text-gray-600 whitespace-pre-wrap">
          {displayedText}
          <span className="w-2 h-4 bg-gray-400 inline-block ml-1 animate-pulse" />
        </div>
      )}
    </div>
  );
};

// --- MAIN APP COMPONENT ---
export default function AlphaAI() {
  const [messages, setMessages] = useState<{role: string, content: string, id: number}[]>([]);
  // ... (keep your existing handleSend and weather logic) ...

  return (
    <div className="flex flex-col h-[100dvh] bg-[#F9F9F8] overflow-hidden">
       {/* Chat Area */}
       <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] ${m.role === 'user' ? 'bg-[#ECECF1] p-3 rounded-2xl' : 'w-full'}`}>
              {m.role === 'user' ? (
                <p className="text-sm">{m.content}</p>
              ) : (
                <AlphaTypewriter text={m.content} />
              )}
            </div>
          </div>
        ))}
      </div>
      {/* ... (keep your input bar) ... */}
    </div>
  );
}
