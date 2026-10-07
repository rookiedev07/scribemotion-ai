import fs from 'fs';
import { config } from '../../config/index.js';

class WhisperTranscriptionProvider {
  /**
   * Transcribe audio using OpenAI Whisper or Groq Whisper API with word-level timestamps
   */
  async transcribeAudio(audioPath) {
    const rawKey = config.groqApiKey || config.openaiApiKey || '';
    const isGroq = Boolean(config.groqApiKey) || rawKey.startsWith('gsk_');
    const apiKey = rawKey;

    if (!apiKey) {
      throw new Error('Neither GROQ_API_KEY nor OPENAI_API_KEY is configured on the server. Please provide an API key.');
    }

    if (!fs.existsSync(audioPath)) {
      throw new Error(`Audio file not found at ${audioPath}`);
    }

    const formData = new FormData();
    const fileBuffer = fs.readFileSync(audioPath);
    const blob = new Blob([fileBuffer], { type: 'audio/wav' });
    formData.append('file', blob, 'audio.wav');
    formData.append('model', isGroq ? 'whisper-large-v3' : 'whisper-1');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'word');
    formData.append('timestamp_granularities[]', 'segment');

    const apiUrl = isGroq
      ? 'https://api.groq.com/openai/v1/audio/transcriptions'
      : 'https://api.openai.com/v1/audio/transcriptions';

    console.log(`[WhisperTranscription] Calling ${isGroq ? 'Groq Whisper-large-v3' : 'OpenAI Whisper-1'}...`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${isGroq ? 'Groq' : 'Whisper'} API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return this.normalizeWhisperResponse(data);
  }

  /**
   * Normalize Whisper's verbose_json response into our standard project format
   */
  normalizeWhisperResponse(data) {
    const rawSegments = data.segments || [];
    let allWords = data.words || [];

    // If word timestamps are missing from root, pull from raw segments
    if (allWords.length === 0) {
      for (const seg of rawSegments) {
        if (seg.words && seg.words.length > 0) {
          allWords.push(...seg.words);
        } else {
          allWords.push(...this.approximateWords(seg.text || '', seg.start, seg.end));
        }
      }
    }

    // Clean word tokens
    allWords = allWords.map(w => ({
      word: (w.word || '').trim(),
      start: parseFloat(Number(w.start).toFixed(2)),
      end: parseFloat(Number(w.end).toFixed(2))
    })).filter(w => w.word.length > 0);

    // Group words into clean 3 to 4 word single-line subtitle segments
    const groupedSegments = this.groupWordsIntoSegments(allWords, 4, 2.2);

    return {
      language: data.language || 'en',
      segments: groupedSegments.length > 0 ? groupedSegments : rawSegments
    };
  }

  groupWordsIntoSegments(words, maxWords = 4, maxDuration = 2.2) {
    const segments = [];
    if (!words || words.length === 0) return segments;

    let currentWords = [];
    let segIdx = 1;

    for (let i = 0; i < words.length; i++) {
      currentWords.push(words[i]);
      const wordText = words[i].word;

      const hasHardPause = wordText.endsWith('.') || wordText.endsWith('!') || wordText.endsWith('?');
      const hasSoftPause = (wordText.endsWith(',') || wordText.endsWith(';')) && currentWords.length >= 3;
      const segDuration = currentWords[currentWords.length - 1].end - currentWords[0].start;
      const isLast = (i === words.length - 1);

      const shouldSplit = (
        isLast ||
        hasHardPause ||
        hasSoftPause ||
        currentWords.length >= maxWords ||
        segDuration >= maxDuration
      );

      if (shouldSplit && currentWords.length > 0) {
        const segStart = currentWords[0].start;
        const segEnd = currentWords[currentWords.length - 1].end;
        const segText = currentWords.map(cw => cw.word).join(' ');

        segments.push({
          id: `seg_${segIdx}`,
          start: parseFloat(segStart.toFixed(2)),
          end: parseFloat(segEnd.toFixed(2)),
          text: segText,
          words: [...currentWords]
        });
        segIdx++;
        currentWords = [];
      }
    }

    return segments;
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
