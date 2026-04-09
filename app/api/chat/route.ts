import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  const { messages } = await req.json();

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: "You are Alpha AI. Give short, detailed academic help with LaTeX. Be a witty buddy for casual chat." },
      ...messages
    ],
    model: "llama-3.3-70b-versatile",
  });

  return NextResponse.json({ text: chatCompletion.choices[0].message.content });
}
