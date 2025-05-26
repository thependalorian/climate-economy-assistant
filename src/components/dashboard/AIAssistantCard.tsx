import React, { useState } from 'react';
import { MessageSquareText, Send } from 'lucide-react';

export const AIAssistantCard: React.FC = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: 'Hello! I\'m your Climate Ecosystem Assistant. How can I help with your clean energy career journey today?' }
  ]);
  
  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    setChatHistory([...chatHistory, { role: 'user', content: message }]);
    
    setTimeout(() => {
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: 'I can help you explore clean energy careers that match your skills. Would you like to know more about solar installation, energy efficiency, or building performance roles?' 
      }]);
    }, 1000);
    
    setMessage('');
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div className="card flex flex-col h-full">
      <div className="border-b border-midnight-forest-200 p-4">
        <div className="flex items-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-spring-green-100">
            <MessageSquareText className="h-4 w-4 text-spring-green-600" />
          </div>
          <h3 className="ml-2 font-medium text-midnight-forest-900">AI Career Assistant</h3>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.map((msg, i) => (
          <div 
            key={i} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                msg.role === 'user' 
                  ? 'bg-spring-green-500 text-midnight-forest-900' 
                  : 'bg-midnight-forest-100 text-midnight-forest-800'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      
      <div className="border-t border-midnight-forest-200 p-4">
        <div className="flex items-center">
          <textarea
            className="textarea flex-1 resize-none"
            placeholder="Ask about clean energy careers..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={1}
          />
          <button
            type="button"
            className="ml-2 flex h-10 w-10 items-center justify-center rounded-full bg-spring-green-500 text-midnight-forest-900 hover:bg-spring-green-600"
            onClick={handleSendMessage}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};