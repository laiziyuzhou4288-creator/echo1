
import React from 'react';

interface TarotMessageProps {
  text: string;
  role: 'user' | 'model';
}

const TarotMessage: React.FC<TarotMessageProps> = ({ text, role }) => {
  // Regex to identify HTTP/HTTPS URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  // Helper to determine if a URL is an image we should render
  const isImage = (url: string) => {
    const lower = url.toLowerCase();
    // Check for Supabase domain or common image extensions
    return (lower.includes('supabase.co') || /\.(jpg|jpeg|png|gif|webp)($|\?)/.test(lower));
  };

  const parts = text.split(urlRegex);

  return (
    <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed font-serif whitespace-pre-wrap break-words ${
      role === 'user' 
        ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-900/20' 
        : 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5 shadow-md'
    }`}>
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
            if (isImage(part)) {
                return (
                    <div key={index} className="my-3 first:mt-0 last:mb-0 rounded-lg overflow-hidden border border-white/10 shadow-lg bg-black/20">
                        <img 
                            src={part} 
                            alt="Visual Content" 
                            className="w-full h-auto max-w-[240px] object-cover block mx-auto transition-opacity duration-500 animate-in fade-in"
                            loading="lazy"
                        />
                    </div>
                );
            } else {
                return (
                    <a 
                        key={index} 
                        href={part} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-indigo-300 underline underline-offset-2 break-all hover:text-indigo-200 transition-colors"
                    >
                        {part}
                    </a>
                );
            }
        }
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
};

export default TarotMessage;
