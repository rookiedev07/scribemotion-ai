import fs from 'fs';
import { config } from '../../config/index.js';

class WhisperTranscriptionProvider {
  constructor() {
    this.apiKey = config.openaiApiKey;
  }

  /**
   * Transcribe audio using OpenAI Whisper API with word-level timestamps
   */
  async transcribeAudio(audioPath) {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is not configured on the server. Please switch to mock provider or provide an API key.');
    }

    if (!fs.existsSync(audioPath)) {
      throw new Error(`Audio file not found at ${audioPath}`);
    }

    const fileStream = fs.createReadStream(audioPath);
    const formData = new FormData();
    // Node.js 18+ Blob/File support
    const fileBuffer = fs.readFileSync(audioPath);
    const blob = new Blob([fileBuffer], { type: 'audio/wav' });
    formData.append('file', blob, 'audio.wav');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'word');
    formData.append('timestamp_granularities[]', 'segment');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Whisper API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return this.normalizeWhisperResponse(data);
  }

  /**
   * Normalize Whisper's verbose_json response into our standard project format
   */
  normalizeWhisperResponse(data) {
    const rawSegments = data.segments || [];
    const allWords = data.words || [];

    const segments = rawSegments.map((seg, idx) => {
      // Find words that fall within this segment's time boundary
      const segmentWords = allWords
        .filter(w => w.start >= seg.start - 0.05 && w.end <= seg.end + 0.1)
        .map(w => ({
          word: (w.word || '').trim(),
          start: parseFloat(w.start.toFixed(2)),
          end: parseFloat(w.end.toFixed(2))
        }));

      // Fallback: If word timestamps weren't returned for this segment, approximate word intervals
      const words = segmentWords.length > 0 ? segmentWords : this.approximateWords(seg.text || '', seg.start, seg.end);

      return {
        id: `seg_${idx + 1}`,
        start: parseFloat(seg.start.toFixed(2)),
        end: parseFloat(seg.end.toFixed(2)),
        text: (seg.text || '').trim(),
        words
      };
    });

    return {
      language: data.language || 'en',
      segments
    };
  }

  approximateWords(text, start, end) {
    const tokens = text.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return [];
    const duration = Math.max(0.1, end - start);
    const wordDur = duration / tokens.length;

    return tokens.map((word, i) => ({
      word,
      start: parseFloat((start + i * wordDur).toFixed(2)),
      end: parseFloat((start + (i + 1) * wordDur).toFixed(2))
    }));
  }
}

export const whisperTranscriptionProvider = new WhisperTranscriptionProvider();
