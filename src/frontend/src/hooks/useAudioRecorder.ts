import { useState, useRef, useCallback } from 'react';
import { transcribeAudio } from '@api/transcribe';

export interface UseAudioRecorderReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  transcribeError: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
}

/**
 * 音声録音・STT変換フック
 * - MediaRecorder API で音声を録音
 * - 録音停止後に POST /transcribe でテキスト変換
 * - 変換結果をコールバックで返す
 */
export const useAudioRecorder = (
  onTranscribed: (text: string) => void,
): UseAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async (): Promise<void> => {
    setTranscribeError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e: BlobEvent): void => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = (): void => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());

        setIsTranscribing(true);
        void transcribeAudio(audioBlob)
          .then((response) => {
            if (response.success && response.data !== null) {
              onTranscribed(response.data.transcript);
            } else {
              setTranscribeError('音声を認識できませんでした');
            }
          })
          .catch(() => {
            setTranscribeError('音声を認識できませんでした');
          })
          .finally(() => {
            setIsTranscribing(false);
          });
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      setTranscribeError('マイクへのアクセスが拒否されました');
    }
  }, [onTranscribed]);

  const stopRecording = useCallback((): void => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  return {
    isRecording,
    isTranscribing,
    transcribeError,
    startRecording,
    stopRecording,
  };
};
