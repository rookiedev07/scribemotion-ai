import { config } from '../../config/index.js';
import { localWhisperProvider } from './localWhisperProvider.js';
import { whisperTranscriptionProvider } from './whisperTranscriptionProvider.js';

class TranscriptionService {
  constructor() {
    this.providerType = config.transcriptionProvider || 'local';
  }

  getProvider() {
    // 1. If OpenAI API key is explicitly configured, use Whisper API
    if (config.openaiApiKey && this.providerType === 'openai') {
      return whisperTranscriptionProvider;
    }
    // 2. Default to Local Whisper model (fully dynamic speech recognition from audio)
    return localWhisperProvider;
  }

  /**
   * Main interface method: transcribeAudio(audioPath)
   * Dynamically transcribes the ACTUAL audio of the video with word timestamps
   */
  async transcribeAudio(audioPath) {
    const provider = this.getProvider();
    console.log(`[TranscriptionService] Starting dynamic transcription with ${provider.constructor.name}...`);
    try {
      return await provider.transcribeAudio(audioPath);
    } catch (primaryErr) {
      console.warn(`[TranscriptionService] Primary provider failed: ${primaryErr.message}. Trying local Whisper fallback...`);
      if (provider !== localWhisperProvider) {
        return await localWhisperProvider.transcribeAudio(audioPath);
      }
      throw primaryErr;
    }
  }

  /**
   * Streaming interface that emits progressive chunks over SSE
   */
  async streamTranscription({ audioPath, onStart, onSegment, onComplete, onError }) {
    try {
      if (onStart) onStart();

      // Transcribe real audio dynamically
      const result = await this.transcribeAudio(audioPath);
      const segments = result.segments || [];

      // Deliver dynamic segments progressively over SSE for real-time visualization
      const delay = (ms) => new Promise(res => setTimeout(res, ms));

      for (let i = 0; i < segments.length; i++) {
        await delay(160);
        if (onSegment) {
          onSegment(segments[i], i, segments.length);
        }
      }

      await delay(100);
      if (onComplete) {
        onComplete(result);
      }
      return result;
    } catch (err) {
      console.error('[TranscriptionService] Streaming error:', err);
      if (onError) onError(err);
      throw err;
    }
  }
}

export const transcriptionService = new TranscriptionService();
