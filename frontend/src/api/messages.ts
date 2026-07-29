import apiClient from './client';
import { ApiConversation, ApiMessage } from '../types';
import { MOCK_CONVERSATIONS, MOCK_MESSAGES } from '../data';

export async function getConversations(): Promise<ApiConversation[]> {
  try {
    const res = await apiClient.get('/messages/conversations');
    const raw = res.data;
    let data: ApiConversation[] = [];
    if (Array.isArray(raw)) data = raw;
    else if (Array.isArray(raw?.data)) data = raw.data;

    return data.length > 0 ? data : MOCK_CONVERSATIONS;
  } catch {
    return MOCK_CONVERSATIONS;
  }
}

export async function getConversation(
  conversationId: string,
): Promise<{ id: string; messages: ApiMessage[] }> {
  // Return mock messages for mock conversations
  if (conversationId.startsWith('mock-')) {
    return {
      id: conversationId,
      messages: MOCK_MESSAGES[conversationId] ?? [],
    };
  }

  try {
    const res = await apiClient.get<{ id: string; messages: ApiMessage[] }>(
      `/messages/conversations/${conversationId}`,
    );
    return res.data;
  } catch {
    return { id: conversationId, messages: [] };
  }
}

export async function sendMessage(
  conversationId: string,
  content: string,
): Promise<void> {
  if (conversationId.startsWith('mock-')) return; // no-op for mock
  await apiClient.post(`/messages/conversations/${conversationId}/send`, {
    content,
    attachmentUrl: null,
  });
}
