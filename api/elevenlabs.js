// Serverless API proxy for ElevenLabs
// Deployed at /api/elevenlabs (Vercel serverless function)
// Keeps API key server-side only

const VOICE_ID = 'Xb7hH8MSUJpSbSDYk0k2';
const MODEL = 'eleven_multilingual_v2';
const API_KEY = process.env.ELEVENLABS_API_KEY || 'sk_7ef27dccb32144843f8ee5068dfd4223a85326c56c14b00a';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, voice_settings } = req.body;

    if (!text || typeof text !== 'string' || text.length > 1000) {
      return res.status(400).json({ error: 'Invalid text' });
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: MODEL,
          voice_settings: voice_settings || {
            stability: 0.65,
            similarity_boost: 0.75,
            style: 0.25,
            use_speaker_boost: false,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('ElevenLabs proxy error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
