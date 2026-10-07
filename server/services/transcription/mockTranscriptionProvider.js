import { ffmpegService } from '../ffmpegService.js';

const SAMPLE_SENTENCES = [
  "Welcome back everyone to today's video",
  "Today we are exploring something incredible",
  "AI powered animated subtitles with real-time word tracking",
  "Notice how every spoken word highlights instantly",
  "Captions increase viewer retention by over eighty percent",
  "You can customize fonts, colors, and animation styles",
  "Then export your final high definition video with burned in captions",
  "Make sure to follow along for more creative tools"
];

class MockTranscriptionProvider {
  /**
   * Generates realistic timestamped segments with word-level precision
   * adapted to the actual duration of the audio file.
   */
  async transcribeAudio(audioPath) {
    let totalDuration = 12.0;

    // Try probing the actual duration from the audio file
    try {
      const meta = await ffmpegService.getVideoMetadata(audioPath);
      if (meta && meta.duration > 1) {
        totalDuration = meta.duration;
      }
    } catch (err) {
      console.warn('Could not probe audio duration for mock, using default 12s:', err.message);
    }

    const segments = [];
    let currentTime = 0.4; // slight initial delay
    let sentenceIdx = 0;

    while (currentTime < totalDuration - 0.5 && sentenceIdx < 20) {
      const sentence = SAMPLE_SENTENCES[sentenceIdx % SAMPLE_SENTENCES.length];
      const rawWords = sentence.split(/\s+/).filter(Boolean);
      
      const segmentStart = parseFloat(currentTime.toFixed(2));
      const words = [];
      let wordTime = segmentStart;

      for (let i = 0; i < rawWords.length; i++) {
        const rawWord = rawWords[i];
        // Dynamic duration based on word length
        const baseDuration = Math.max(0.24, Math.min(0.65, rawWord.length * 0.08));
        const wStart = parseFloat(wordTime.toFixed(2));
        const wEnd = parseFloat((wordTime + baseDuration).toFixed(2));
        
        words.push({
          word: rawWord,
          start: wStart,
          end: wEnd
        });

        // Small micro-pause between words
        wordTime = wEnd + 0.04;
      }

      const segmentEnd = parseFloat((words[words.length - 1].end + 0.15).toFixed(2));

      segments.push({
        id: `seg_${segments.length + 1}`,
        start: segmentStart,
        end: segmentEnd,
        text: sentence,
        words
      });

      // Pause between sentences (0.3s to 0.6s)
      currentTime = segmentEnd + 0.4;
      sentenceIdx++;
    }

    // Ensure we have at least 1 segment if duration was very short
    if (segments.length === 0) {
      segments.push({
        id: 'seg_1',
        start: 0.2,
        end: Math.max(1.8, totalDuration),
        text: "Welcome to ScribeMotion AI video subtitles",
        words: [
          { word: "Welcome", start: 0.2, end: 0.6 },
          { word: "to", start: 0.62, end: 0.8 },
          { word: "ScribeMotion", start: 0.82, end: 1.3 },
          { word: "AI", start: 1.32, end: 1.6 }
        ]
      });
    }

    return {
      language: 'en',
      segments
    };
  }
}

export const mockTranscriptionProvider = new MockTranscriptionProvider();
