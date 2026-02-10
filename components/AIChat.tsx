
import React, { useState, useRef, useEffect } from 'react';
import { chatWithAssistant, searchIndustryTrends } from '../services/gemini';

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  context: any;
}

const AIChat: React.FC<AIChatProps> = ({ isOpen, onClose, context }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string; sources?: any[] }[]>([
    { role: 'ai', text: 'Hi! I am EESAA Smart Assistant. How can I help you with your branch management or inventory today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      let responseText = '';
      let sources = undefined;

      // Use Search Grounding if query looks like a trend/market search
      if (userMsg.toLowerCase().includes('trend') || userMsg.toLowerCase().includes('price') || userMsg.toLowerCase().includes('market')) {
        const res = await searchIndustryTrends(userMsg);
        responseText = res.text;
        sources = res.sources;
      } else {
        responseText = await chatWithAssistant(userMsg, context);
      }

      setMessages(prev => [...prev, { role: 'ai', text: responseText, sources }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "I'm having trouble connecting to the brain center. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white max-w-md mx-auto animate-in slide-in-from-bottom-full duration-300">
      <header className="bg-green-700 p-6 text-white flex justify-between items-center rounded-b-[40px] shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
            <i className="fa-solid fa-sparkles"></i>
          </div>
          <div>
            <h2 className="font-black text-lg">Smart Assistant</h2>
            <div className="flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
               <span className="text-[10px] font-bold text-green-200">GEMINI 3.0 POWERED</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 -mr-2 text-white/70 active:text-white transition-colors">
          <i className="fa-solid fa-xmark text-2xl"></i>
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-gray-50/50">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-3xl shadow-sm text-sm leading-relaxed ${
              m.role === 'user' 
                ? 'bg-green-700 text-white rounded-tr-none' 
                : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
            }`}>
              {m.text}
              {m.sources && m.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Sources Found:</p>
                  <div className="flex flex-wrap gap-2">
                    {m.sources.map((s: any, i: number) => (
                      <a key={i} href={s.web?.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold">
                        {s.web?.title || 'Resource'}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-3xl rounded-tl-none shadow-sm border border-gray-100 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] safe-bottom">
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:ring-2 ring-green-500 ring-offset-2 transition-all">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about stock, reports, trends..."
            className="flex-1 bg-transparent border-none outline-none p-2 text-sm font-medium text-gray-700"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              input.trim() && !isLoading ? 'bg-green-700 text-white shadow-lg active:scale-90' : 'bg-gray-200 text-gray-400'
            }`}
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
