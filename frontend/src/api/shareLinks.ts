import { apiDelete, apiGet, apiPost } from './client';
import type { SerializedInputs } from '@/domain/finance/types';

type SaveResponse = { share_id: string };

type LoadResponse = {
  share_id: string;
  input_data: SerializedInputs;
  created_at: string;
  updated_at: string;
};

export async function saveCalculation(inputData: SerializedInputs): Promise<string> {
  const res = await apiPost<SaveResponse>('/api/calculations', { input_data: inputData });
  return res.share_id;
}

export async function loadCalculation(shareId: string): Promise<LoadResponse> {
  return apiGet<LoadResponse>(`/api/calculations/${shareId}`);
}

export async function deleteCalculation(shareId: string): Promise<void> {
  return apiDelete(`/api/calculations/${shareId}`);
}
