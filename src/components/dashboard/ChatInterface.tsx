import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Send, Bot, Loader2 } from 'lucide-react';
import { simulateAgentResponse, generateAgentResponseWithLangGraph } from '../../services/agentService';
import AgentAvatar from './AgentAvatar';

interface ChatInterfaceProps {
  conversationId: string;
  userId: string;
}

interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  agent_name?: string; // The type of agent that responded (for assistant messages)
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ conversationId, userId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages on load and subscribe to new messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // Get existing messages
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        setMessages(data || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        setMessages(current => [...current, payload.new as Message]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send a new message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    setSending(true);

    try {
      // Store the message content before clearing the input
      const messageContent = newMessage;

      // Insert user message
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: conversationId,
            role: 'user',
            content: messageContent
          }
        ]);

      if (error) throw error;

      // Clear input
      setNewMessage('');

      // Use LangGraph-based response generation with streaming
      try {
        await generateAgentResponseWithLangGraph(
          conversationId,
          userId,
          messageContent,
          (chunk: string) => {
            // Handle streaming response
            setStreamingMessage(prev => prev + chunk);
          }
        );
        
        // Clear streaming message after response is complete
        setStreamingMessage('');
      } catch (streamError) {
        console.error('Streaming failed, falling back to regular response:', streamError);
        // Fallback to non-streaming response
        await simulateAgentResponse(conversationId, userId, messageContent);
        setStreamingMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-6 w-6 text-primary-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="h-12 w-12 text-primary-300 mb-2" />
            <p className="text-neutral-500 mb-2">No messages yet.</p>
            <p className="text-sm text-neutral-400">Start the conversation by sending a message below.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex items-start max-w-[80%]">
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 mr-2">
                    <AgentAvatar role="assistant" agentName={message.agent_name} />
                  </div>
                )}
                <div
                  className={`rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary-600 text-white rounded-tr-none'
                      : 'bg-neutral-100 text-neutral-800 rounded-tl-none'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  <div
                    className={`mt-1 text-xs ${
                      message.role === 'user' ? 'text-primary-100' : 'text-neutral-500'
                    }`}
                  >
                    {formatTime(message.created_at)}
                  </div>
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 ml-2">
                    <AgentAvatar role="user" />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {sending && (
          <div className="flex justify-start">
            <div className="flex items-start max-w-[80%]">
              <div className="flex-shrink-0 mr-2">
                <AgentAvatar role="assistant" />
              </div>
              <div className="rounded-lg px-4 py-2 bg-neutral-100 text-neutral-800 rounded-tl-none">
                {streamingMessage ? (
                  <div className="text-sm whitespace-pre-wrap">
                    {streamingMessage}
                    <span className="inline-block w-2 h-4 bg-primary-500 animate-pulse ml-1"></span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-neutral-400 animate-pulse"></div>
                    <div className="h-2 w-2 rounded-full bg-neutral-400 animate-pulse delay-150"></div>
                    <div className="h-2 w-2 rounded-full bg-neutral-400 animate-pulse delay-300"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-neutral-200 p-4">
        <form onSubmit={sendMessage} className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-full border border-neutral-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className={`rounded-full p-2 ${
              sending || !newMessage.trim()
                ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
