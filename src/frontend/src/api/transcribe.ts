import { apiClient } from './client';
import type { ApiResponse } from '@appTypes/index';
import type { TranscribeResponse } from '@appTypes/training';

/**
 * 音声データをテキストに変換する（STT）
 */
export const transcribeAudio = async (
  audioBlob: Blob,
): Promise<ApiResponse<TranscribeResponse>> => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');

  const response = await apiClient.post<ApiResponse<TranscribeResponse>>('/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const data = response.data;
  if (
    typeof data === 'object' &&
    data !== null &&
    'success' in data &&
    'data' in data &&
    'error' in data
  ) {
    return data;
  }

  return {
    success: true,
    data: data as unknown as TranscribeResponse,
    error: null,
  };
};
