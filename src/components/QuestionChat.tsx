
import { useState, useRef, useEffect, type FC, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Bot, Loader2, ArrowRight } from 'lucide-react';
import { askQuestionAssistant } from '../services/gemini';
import { formatText } from '../utils/helpers';
import { Question } from '../types';
import { useTranslation } from '../hooks/useTranslations';

interface QuestionChatProps {
    question: Question;
}

export const QuestionChat: FC<QuestionChatProps> = ({ question }) => {
    const { t, language } = useTranslation();
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const handleChatSend = async (e: FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || isChatLoading) return;

        const userMsg = chatInput.trim();
        setChatInput('');
        
        const newHistory = [...chatHistory, { role: 'user' as const, text: userMsg }];
        setChatHistory(newHistory);
        setIsChatLoading(true);

        try {
            const responseText = await askQuestionAssistant(question, newHistory, userMsg, language);
            setChatHistory((prev) => [...prev, { role: 'model', text: responseText }]);
        } catch {
            setChatHistory((prev) => [
                ...prev,
                { role: 'model', text: t.errors.generic },
            ]);
        } finally {
            setIsChatLoading(false);
        }
    };

    useEffect(() => {
        if (chatContainerRef.current) {
            const { scrollHeight, clientHeight } = chatContainerRef.current;
            chatContainerRef.current.scrollTo({
                top: scrollHeight - clientHeight,
                behavior: 'smooth'
            });
        }
    }, [chatHistory, isChatLoading]);

    return (
        <div className="mt-8">
            <div className="flex items-center gap-2 mb-4 px-2">
                <Sparkles size={16} className="text-sand-500" />
                <span className="text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">{t.askAi}</span>
            </div>
            
            <div className="bg-white/40 dark:bg-stone-900/40 rounded-[2rem] border border-white/50 dark:border-stone-800 shadow-sm overflow-hidden backdrop-blur-md">
                
                {/* Messages Area */}
                <div 
                    ref={chatContainerRef} 
                    className="p-5 h-72 overflow-y-auto scroll-y-pan flex flex-col gap-4 scrollbar-hide"
                >
                    {chatHistory.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-4 opacity-40">
                            <div className="w-12 h-12 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center mb-3 text-stone-400">
                                <Bot size={24} />
                            </div>
                            <p className="text-sm text-stone-500 dark:text-stone-400 font-medium">{t.chatPlaceholder}</p>
                        </div>
                    )}

                    <AnimatePresence initial={false}>
                        {chatHistory.map((msg, i) => (
                            <motion.div 
                                key={i} 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.role === 'model' && (
                                    <div className="w-8 h-8 rounded-full bg-white dark:bg-stone-800 shadow-sm border border-stone-100 dark:border-stone-700 flex items-center justify-center shrink-0 mt-auto">
                                        <Bot size={14} className="text-sand-600 dark:text-sand-400" />
                                    </div>
                                )}
                                
                                <div className={`max-w-[85%] p-3.5 px-5 text-sm leading-relaxed shadow-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-stone-800 text-white dark:bg-sand-500 dark:text-stone-900 rounded-2xl rounded-tr-sm' 
                                    : 'bg-white text-stone-700 dark:bg-stone-800 dark:text-stone-200 rounded-2xl rounded-tl-sm border border-stone-100 dark:border-stone-700/50'
                                }`}>
                                    {formatText(msg.text)}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {isChatLoading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 justify-start">
                            <div className="w-8 h-8 rounded-full bg-white dark:bg-stone-800 shadow-sm border border-stone-100 dark:border-stone-700 flex items-center justify-center shrink-0 mt-auto">
                                <Loader2 size={14} className="text-sand-600 dark:text-sand-400 animate-spin" />
                            </div>
                            <div className="bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700/50 p-4 rounded-2xl rounded-tl-sm flex items-center gap-1.5 shadow-sm">
                                <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="w-1.5 h-1.5 bg-stone-400 rounded-full"></motion.span>
                                <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1.5 h-1.5 bg-stone-400 rounded-full"></motion.span>
                                <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1.5 h-1.5 bg-stone-400 rounded-full"></motion.span>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-3 bg-white/50 dark:bg-stone-900/50 border-t border-stone-100 dark:border-stone-800 backdrop-blur-md">
                    <form onSubmit={handleChatSend} className="relative flex items-center">
                        <input 
                            type="text" 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder={t.chatPlaceholder}
                            className="w-full bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 focus:border-sand-400 dark:focus:border-sand-600 focus:ring-2 focus:ring-sand-100 dark:focus:ring-sand-900/20 rounded-xl pl-4 pr-12 py-3.5 text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-600 outline-none transition-all shadow-sm"
                        />
                        <button 
                            type="submit" 
                            disabled={!chatInput.trim() || isChatLoading}
                            className="absolute right-2 p-2 bg-stone-800 dark:bg-sand-500 text-white dark:text-stone-900 rounded-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed transition-all shadow-md"
                        >
                            <ArrowRight size={16} strokeWidth={2.5} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
