import React, { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setAudioPlaying } from '@store/sessionSlice';

interface AudioPlayerProps {
  audioUrl: string | null;
  onEnded?: () => void;
}

/**
 * 音声再生コンポーネント（非表示）
 * - audioUrl が変更されると自動再生
 * - 再生状態を Redux に通知
 */
const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, onEnded }) => {
  const dispatch = useDispatch();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleEnded = useCallback((): void => {
    dispatch(setAudioPlaying(false));
    onEnded?.();
  }, [dispatch, onEnded]);

  useEffect(() => {
    if (audioUrl === null) return;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', () => {
      dispatch(setAudioPlaying(false));
    });

    dispatch(setAudioPlaying(true));
    void audio.play().catch(() => {
      dispatch(setAudioPlaying(false));
    });

    return (): void => {
      audio.pause();
      audio.removeEventListener('ended', handleEnded);
      dispatch(setAudioPlaying(false));
    };
  }, [audioUrl, dispatch, handleEnded]);

  // 非表示コンポーネント（UIなし）
  return null;
};

export default AudioPlayer;
