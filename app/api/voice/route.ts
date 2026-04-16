// app/api/voice/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    const voiceId = process.env.NEXT_PUBLIC_VOICE_ID;
    const apiKey = process.env.ELEVENLABS_API_KEY;

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey || '',
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_flash_v2_5", // Low latency model
        voice_settings: { stability: 0.5, similarity_boost: 0.8 }
      }),
    });

    if (!response.ok) throw new Error('ElevenLabs Error');

    const audioBuffer = await response.arrayBuffer();
    return new Response(audioBuffer, {
      headers: { 'Content-Type': 'audio/mpeg' },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate voice' }, { status: 500 });
  }
}
