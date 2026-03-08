/**
 * Audio recording service using MediaRecorder API
 */

let mediaRecorder = null;
let stream = null;
let chunks = [];

let chunkCounter = 0;

export const startRecording = async (onDataAvailable, onStop) => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

    const mimeType = getSupportedMimeType();
    mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
    chunks = [];
    chunkCounter = 0;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
        chunkCounter++;
        if (onDataAvailable) onDataAvailable(event.data);
        // Send partial transcript every 10 seconds (10 chunks)
        if (chunkCounter % 10 === 0) {
          const partialBlob = new Blob(chunks, { type: mimeType || 'audio/webm' });
          // Send partial blob for transcription
          if (onDataAvailable) onDataAvailable(partialBlob, true); // true for partial
        }
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType || 'audio/webm' });
      if (onStop) onStop(blob);
      stopStreamTracks();
    };

    mediaRecorder.start(1000); // Collect data every second
    return { success: true };
  } catch (error) {
    const msg = error.name === 'NotAllowedError'
      ? 'Microphone access denied. Please grant permission.'
      : `Recording failed: ${error.message}`;
    return { success: false, error: msg };
  }
};

export const stopRecording = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    return true;
  }
  return false;
};

export const pauseRecording = () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.pause();
    return true;
  }
  return false;
};

export const resumeRecording = () => {
  if (mediaRecorder && mediaRecorder.state === 'paused') {
    mediaRecorder.resume();
    return true;
  }
  return false;
};

export const getRecordingState = () => mediaRecorder?.state || 'inactive';

const stopStreamTracks = () => {
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
};

const getSupportedMimeType = () => {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/mp4'];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) || null;
};

export const blobToFile = (blob, filename) => {
  return new File([blob], filename, { type: blob.type });
};

export const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};
