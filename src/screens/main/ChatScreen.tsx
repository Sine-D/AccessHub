import React, { useState } from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';
import { mockMessages } from '../../services/mockData';
import { Message } from '../../types';
import { TopHeader } from '../../components/layout/TopHeader';
import { BottomNav } from '../../components/layout/BottomNav';
import { 
  Send, 
  Mic, 
  Paperclip, 
  Play, 
  Pause, 
  CheckCheck 
} from 'lucide-react';

export const ChatScreen: React.FC = () => {
  const { speakText } = useAccessibility();
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [inputText, setInputText] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const newMsg: Message = {
      id: `m_${Date.now()}`,
      senderId: 'u1',
      senderName: 'Kavindi Perera',
      senderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
      text: text,
      timestamp: 'Just now',
      isMine: true,
      status: 'sent'
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    speakText(`Sent message: ${text}`);

    // Auto simulated reply
    setTimeout(() => {
      const replyMsg: Message = {
        id: `m_reply_${Date.now()}`,
        senderId: 'u2',
        senderName: 'Sahan Wickramasinghe',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
        text: 'Thank you! Looking forward to receiving the accessible package.',
        timestamp: 'Just now',
        isMine: false,
        status: 'read'
      };
      setMessages(prev => [...prev, replyMsg]);
      speakText('Received reply: Thank you! Looking forward to receiving the accessible package.');
    }, 1500);
  };

  const quickReplies = [
    'Is wheelchair delivery available?',
    'Can you provide sign language help?',
    'What is your expected delivery time?'
  ];

  return (
    <div className="w-full h-full min-h-[800px] bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col justify-between overflow-y-auto">
      
      <TopHeader title="Messenger Chat 💬" />

      {/* Messages Scroll Area */}
      <div className="p-4 space-y-3 flex-1 overflow-y-auto pb-4">
        
        {/* Chat Partner Header Card */}
        <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300" alt="partner" className="w-10 h-10 rounded-full object-cover" />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white"></span>
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white">Sahan Wickramasinghe</h4>
              <span className="text-[10px] text-teal-600 dark:text-teal-400 font-extrabold">♿ Visually Impaired Buyer</span>
            </div>
          </div>
        </div>

        {/* Message Bubbles */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.isMine ? 'items-end' : 'items-start'}`}
          >
            <div className={`max-w-[80%] p-3.5 rounded-3xl text-xs space-y-1 ${
              msg.isMine
                ? 'bg-blue-600 text-white rounded-br-none shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-none border border-slate-200 dark:border-slate-800 shadow-xs'
            }`}>
              
              {/* Voice Message simulation */}
              {msg.isVoice ? (
                <div className="flex items-center space-x-3 py-1">
                  <button
                    onClick={() => {
                      setIsPlayingAudio(!isPlayingAudio);
                      speakText('Playing audio message from Sahan.');
                    }}
                    className="p-2 rounded-full bg-white/20 dark:bg-slate-700 text-current flex items-center justify-center shrink-0"
                  >
                    {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                  <div className="flex-1 space-y-1">
                    {/* Simulated Waveform */}
                    <div className="flex items-center space-x-0.5 h-4">
                      {[40, 70, 30, 90, 50, 80, 40, 60, 100, 50].map((h, i) => (
                        <div 
                          key={i} 
                          className="w-1 bg-current opacity-70 rounded-full" 
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] opacity-80 font-bold block">{msg.voiceDuration} • Voice Message</span>
                  </div>
                </div>
              ) : (
                <p className="leading-relaxed font-medium">{msg.text}</p>
              )}

              <div className="flex items-center justify-end space-x-1 text-[9px] opacity-75 pt-0.5">
                <span>{msg.timestamp}</span>
                {msg.isMine && <CheckCheck className="w-3 h-3 text-blue-200" />}
              </div>
            </div>
          </div>
        ))}

        {/* Quick Reply Pills */}
        <div className="pt-2 space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Quick Replies:</span>
          <div className="flex flex-wrap gap-1.5">
            {quickReplies.map((qr, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(qr)}
                className="px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-[11px] font-bold hover:bg-blue-100"
              >
                💬 {qr}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Chat Input Bar */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3 flex items-center space-x-2">
        <button className="p-2 text-slate-400 hover:text-slate-600">
          <Paperclip className="w-4 h-4" />
        </button>
        <button 
          onClick={() => handleSendMessage('🎙️ [Voice Audio Message Recorded]')}
          className="p-2 text-slate-400 hover:text-blue-500"
          title="Hold for Voice Message"
        >
          <Mic className="w-4 h-4" />
        </button>

        <input
          type="text"
          placeholder="Type accessible message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          className="flex-1 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <button
          onClick={() => handleSendMessage()}
          className="p-2.5 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      <BottomNav />

    </div>
  );
};
