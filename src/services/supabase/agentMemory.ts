import { supabase, isConfigured } from './client';

function db() {
  if (!isConfigured || !supabase) throw new Error('Supabase is required for agent memory.');
  return supabase;
}

export type AgentMessageRole = 'user' | 'assistant' | 'tool' | 'system';

export interface AgentMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: AgentMessageRole;
  content: unknown;
  created_at: string;
}

export interface AgentConversation {
  id: string;
  user_id: string;
  title?: string | null;
  created_at: string;
  updated_at: string;
}

export async function createAgentConversation(userId: string, title = 'Career Coach Conversation'): Promise<AgentConversation> {
  const result = await db().from('agent_conversations').insert([{ user_id: userId, title }]).select().single();
  if (result.error) throw result.error;
  return result.data;
}

export async function listAgentConversations(userId: string): Promise<AgentConversation[]> {
  const result = await db().from('agent_conversations').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
  if (result.error) throw result.error;
  return result.data || [];
}

export async function saveAgentMessage(userId: string, conversationId: string, role: AgentMessageRole, content: unknown): Promise<AgentMessage> {
  const client = db();
  const message = await client.from('agent_messages').insert([{ user_id: userId, conversation_id: conversationId, role, content }]).select().single();
  if (message.error) throw message.error;
  const conversation = await client.from('agent_conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId).eq('user_id', userId);
  if (conversation.error) throw conversation.error;
  return message.data;
}

export async function getAgentMessages(userId: string, conversationId: string): Promise<AgentMessage[]> {
  const result = await db().from('agent_messages').select('*').eq('user_id', userId).eq('conversation_id', conversationId).order('created_at', { ascending: true });
  if (result.error) throw result.error;
  return result.data || [];
}