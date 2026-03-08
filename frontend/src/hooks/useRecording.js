import { useState, useRef, useCallback, useEffect } from 'react';
import { startRecording, stopRecording, pauseRecording, resumeRecording, formatTime, blobToFile } from '../services/audio';
import { sendTranscriptionAudioChunk } from '../services/socket';

const useRecording = (sessionId) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const clearTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const startTimer = () => {
    clearTimer();
    intervalRef.current = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
  };

  const start = useCallback(async () => {
    setError(null);
    setAudioBlob(null);
    setDuration(0);

    const result = await startRecording(
      (chunk, isPartial) => { 
        if (isPartial) {
          // Send partial audio for real-time transcription
          sendTranscriptionAudioChunk(sessionId, chunk);
        }
      },
      (blob) => {
        setAudioBlob(blob);
        setIsRecording(false);
        setIsPaused(false);
        clearTimer();
      }
    );

    if (result.success) {
      setIsRecording(true);
      startTimer();
    } else {
      setError(result.error);
    }
  }, []);

  const stop = useCallback(() => {
    stopRecording();
    clearTimer();
  }, []);

  const pause = useCallback(() => {
    if (pauseRecording()) {
      setIsPaused(true);
      clearTimer();
    }
  }, []);

  const resume = useCallback(() => {
    if (resumeRecording()) {
      setIsPaused(false);
      startTimer();
    }
  }, []);

  useEffect(() => () => clearTimer(), []);

  return {
    isRecording,
    isPaused,
    duration,
    durationFormatted: formatTime(duration),
    audioBlob,
    error,
    start,
    stop,
    pause,
    resume,
    audioFile: audioBlob ? blobToFile(audioBlob, `recording_${Date.now()}.webm`) : null,
  };
};

export default useRecording;
