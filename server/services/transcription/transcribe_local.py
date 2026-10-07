import sys
import os
import json
import warnings

# Suppress warnings for clean JSON stdout
warnings.filterwarnings('ignore')
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

def group_words_into_segments(words, max_words_per_segment=4, max_duration=2.2):
    """
    Group word-level timestamp tokens into short, single-line subtitle segments.
    2-4 words per segment keeps captions on ONE LINE and highly readable.
    """
    segments = []
    if not words:
        return segments

    current_words = []
    seg_idx = 1

    for i, w in enumerate(words):
        current_words.append(w)
        word_text = w['word'].strip()

        # Hard sentence-ending punctuation always splits
        has_hard_pause = word_text.endswith(('.', '!', '?'))
        # Soft pause on comma only if we have enough words
        has_soft_pause = word_text.endswith((',', ';')) and len(current_words) >= 3
        seg_duration = current_words[-1]['end'] - current_words[0]['start']

        is_last = (i == len(words) - 1)
        should_split = (
            is_last or
            has_hard_pause or
            (has_soft_pause) or
            len(current_words) >= max_words_per_segment or
            seg_duration >= max_duration
        )

        if should_split and current_words:
            seg_start = current_words[0]['start']
            seg_end = current_words[-1]['end']
            seg_text = ' '.join(cw['word'] for cw in current_words)

            segments.append({
                'id': f'seg_{seg_idx}',
                'start': round(seg_start, 2),
                'end': round(seg_end, 2),
                'text': seg_text,
                'words': current_words
            })
            seg_idx += 1
            current_words = []

    return segments

def transcribe_with_whisper(audio_path, ffmpeg_dir=None):
    if ffmpeg_dir and os.path.exists(ffmpeg_dir):
        os.environ['PATH'] = ffmpeg_dir + os.pathsep + os.environ.get('PATH', '')

    from transformers import pipeline

    pipe = pipeline(
        'automatic-speech-recognition',
        model='openai/whisper-tiny',
        return_timestamps='word',
        chunk_length_s=30
    )

    result = pipe(audio_path)
    full_text = result.get('text', '').strip()
    raw_chunks = result.get('chunks', [])

    normalized_words = []
    for chunk in raw_chunks:
        ts = chunk.get('timestamp', (0.0, 0.0))
        if ts and len(ts) == 2 and ts[0] is not None and ts[1] is not None:
            w_text = chunk.get('text', '').strip()
            if w_text:
                normalized_words.append({
                    'word': w_text,
                    'start': round(float(ts[0]), 2),
                    'end': round(float(ts[1]), 2)
                })

    segments = group_words_into_segments(normalized_words)
    return {
        'language': 'en',
        'text': full_text,
        'segments': segments
    }

def transcribe_with_speech_recognition(audio_path):
    import speech_recognition as sr
    import wave

    # Read audio duration
    duration = 5.0
    try:
        with wave.open(audio_path, 'rb') as w:
            duration = w.getnframes() / float(w.getframerate())
    except:
        pass

    r = sr.Recognizer()
    with sr.AudioFile(audio_path) as source:
        audio = r.record(source)

    text = r.recognize_google(audio)
    tokens = text.split()
    if not tokens:
        return {'language': 'en', 'segments': []}

    word_dur = duration / max(1, len(tokens))
    words = []
    for i, t in enumerate(tokens):
        w_start = round(i * word_dur, 2)
        w_end = round((i + 1) * word_dur, 2)
        words.append({'word': t, 'start': w_start, 'end': w_end})

    segments = group_words_into_segments(words)
    return {
        'language': 'en',
        'text': text,
        'segments': segments
    }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No audio path provided'}))
        sys.exit(1)

    audio_path = sys.argv[1]
    ffmpeg_dir = sys.argv[2] if len(sys.argv) > 2 else None

    if not os.path.exists(audio_path):
        print(json.dumps({'error': f'Audio file not found: {audio_path}'}))
        sys.exit(1)

    try:
        # 1. Attempt Whisper pipeline with word-level timestamps
        res = transcribe_with_whisper(audio_path, ffmpeg_dir)
        print(json.dumps(res))
    except Exception as e_whisper:
        try:
            # 2. Fallback to Google SpeechRecognition
            res = transcribe_with_speech_recognition(audio_path)
            print(json.dumps(res))
        except Exception as e_sr:
            print(json.dumps({
                'error': f'Transcription failed. Whisper: {str(e_whisper)}; SpeechRecognition: {str(e_sr)}'
            }))
            sys.exit(1)

if __name__ == '__main__':
    main()
