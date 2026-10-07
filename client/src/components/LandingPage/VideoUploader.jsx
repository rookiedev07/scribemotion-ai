import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Film,
  FileVideo,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  Play
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';

const ACCEPTED_FORMATS = ['.mp4', '.mov', '.webm', '.mkv'];

export default function VideoUploader({ onUploaded }) {
  const { setProject } = useProjectStore();

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle | uploading | processing | success | error
  const [errorMessage, setErrorMessage] = useState('');

  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    setErrorMessage('');
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ACCEPTED_FORMATS.includes(ext)) {
      setErrorMessage(`Unsupported format (${ext}). Supported: ${ACCEPTED_FORMATS.join(', ')}`);
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      setErrorMessage('File size exceeds 500MB limit.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  // Perform upload to POST /api/videos
  const startUpload = async () => {
    if (!selectedFile) return;

    setUploadStatus('uploading');
    setUploadProgress(15);
    setErrorMessage('');

    const formData = new FormData();
    formData.append('video', selectedFile);

    try {
      const xhr = new XMLHttpRequest();

      // Track progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 90);
          setUploadProgress(percent);
          if (percent >= 90) {
            setUploadStatus('processing');
          }
        }
      });

      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status === 201 || xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            setUploadProgress(100);
            setUploadStatus('success');

            // Store in Zustand
            setProject({
              id: data.projectId,
              video: data.video,
              status: 'uploaded',
              transcript: { language: 'en', segments: [] }
            });

            // Proceed to transcription screen
            setTimeout(() => {
              if (onUploaded) onUploaded(data.projectId);
            }, 600);
          } else {
            let errorMsg = 'Upload failed';
            try {
              const resJson = JSON.parse(xhr.responseText);
              errorMsg = resJson.error || errorMsg;
            } catch (_) {}
            setUploadStatus('error');
            setErrorMessage(errorMsg);
          }
        }
      };

      xhr.open('POST', '/api/videos');
      xhr.send(formData);
    } catch (err) {
      console.error('Upload error:', err);
      setUploadStatus('error');
      setErrorMessage(err.message || 'Network error occurred during upload');
    }
  };

  // 1-Click sample video loader
  const loadSampleVideo = async () => {
    setUploadStatus('uploading');
    setUploadProgress(30);
    setErrorMessage('');

    try {
      setUploadProgress(65);
      setUploadStatus('processing');

      const res = await fetch('/api/videos/sample', { method: 'POST' });
      if (!res.ok) {
        throw new Error('Failed to load sample project');
      }

      const data = await res.json();
      setUploadProgress(100);
      setUploadStatus('success');

      setProject({
        id: data.projectId,
        video: data.video,
        status: 'uploaded',
        transcript: { language: 'en', segments: [] }
      });

      setTimeout(() => {
        if (onUploaded) onUploaded(data.projectId);
      }, 500);
    } catch (err) {
      console.error('Sample project error:', err);
      setUploadStatus('error');
      setErrorMessage(err.message || 'Error creating sample video project');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto select-none">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative rounded-3xl border-2 border-dashed transition-all duration-200 p-8 sm:p-10 flex flex-col items-center justify-center text-center ${
          dragActive
            ? 'border-indigo-500 bg-indigo-950/30 scale-[1.01]'
            : 'border-slate-800 bg-[#0d1117]/80 hover:border-slate-700 hover:bg-[#0d1117]'
        } backdrop-blur-xl shadow-2xl`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".mp4,.mov,.webm,.mkv"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* State 1: File chosen, ready to upload or preview */}
        {selectedFile && uploadStatus === 'idle' ? (
          <div className="w-full space-y-5 animate-fade-in">
            {/* Video preview thumbnail */}
            <div className="relative mx-auto max-w-sm rounded-2xl overflow-hidden border border-slate-700 bg-black/80 aspect-video flex items-center justify-center shadow-lg">
              <video
                src={previewUrl}
                controls={false}
                muted
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                <div className="text-left">
                  <p className="text-xs font-bold text-white truncate max-w-[240px]">
                    {selectedFile.name}
                  </p>
                  <p className="text-[10px] text-slate-300 font-mono">
                    {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={startUpload}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-sm font-bold shadow-xl shadow-indigo-500/25 active:scale-95 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Transcribe Video</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
              >
                Choose Different File
              </button>
            </div>
          </div>
        ) : uploadStatus === 'uploading' || uploadStatus === 'processing' ? (
          /* State 2: Uploading / Processing */
          <div className="w-full max-w-md py-6 space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-100">
                {uploadStatus === 'processing' ? 'Extracting Audio with FFmpeg...' : 'Uploading Video...'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {uploadStatus === 'processing'
                  ? 'Converting audio stream to 16kHz PCM WAV for high accuracy'
                  : `${uploadProgress}% uploaded`}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-300 shadow-sm shadow-indigo-500/50"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          /* State 3: Empty Dropzone ready for file */
          <div className="space-y-4">
            <div
              onClick={() => inputRef.current?.click()}
              className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400 hover:scale-105 hover:bg-indigo-600/20 transition-all cursor-pointer shadow-lg shadow-indigo-500/10"
            >
              <UploadCloud className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-100">
                Drag & Drop your video here
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Upload your video to generate dynamic animated subtitles with word-by-word synchronization
              </p>
            </div>

            <button
              onClick={() => inputRef.current?.click()}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 active:scale-95 transition-all"
            >
              Upload a Video
            </button>

            {/* Supported formats */}
            <div className="flex items-center justify-center gap-1.5 pt-2">
              {ACCEPTED_FORMATS.map((fmt) => (
                <span
                  key={fmt}
                  className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 uppercase"
                >
                  {fmt.replace('.', '')}
                </span>
              ))}
              <span className="text-[11px] text-slate-500 ml-2">Up to 500MB</span>
            </div>

            {/* Quick Demo Option */}
            <div className="pt-4 border-t border-slate-800/80 w-full flex items-center justify-center gap-2">
              <span className="text-[11px] text-slate-500">No video ready?</span>
              <button
                onClick={loadSampleVideo}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline underline-offset-4 flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Try with instant sample video</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300 flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
