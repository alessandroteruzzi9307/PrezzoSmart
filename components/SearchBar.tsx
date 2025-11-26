import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Sparkles, Flame, ChevronRight } from 'lucide-react';
import { getSearchSuggestions } from '../services/geminiService';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (input.trim().length === 0) {
       debounceRef.current = setTimeout(async () => {
         setIsSuggesting(true);
         try {
           const results = await getSearchSuggestions("Novità e prodotti tech flagship 2025");
           setSuggestions(results);
           if (document.activeElement === containerRef.current?.querySelector('input')) {
              setShowSuggestions(true);
           }
         } catch (error) {
           console.error(error);
         } finally {
           setIsSuggesting(false);
         }
       }, 300);
       return;
    }

    if (input.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSuggesting(true);
      try {
        const results = await getSearchSuggestions(input);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.error(error);
      } finally {
        setIsSuggesting(false);
      }
    }, 400); 

  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (input.trim()) {
      onSearch(input.trim());
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setShowSuggestions(false);
    onSearch(suggestion);
  };

  const handleFocus = () => {
     if (suggestions.length > 0) {
        setShowSuggestions(true);
     } else if (input.trim().length === 0) {
        setIsSuggesting(true);
        getSearchSuggestions("Novità e prodotti tech flagship 2025")
          .then(res => {
            setSuggestions(res);
            setShowSuggestions(true);
          })
          .finally(() => setIsSuggesting(false));
     }
  };

  return (
    <div className="w-full max-w-3xl mx-auto relative z-50 px-4" ref={containerRef}>
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
        <div className="relative flex items-center p-2 bg-white rounded-full shadow-2xl shadow-indigo-100 border border-slate-100 transition-all focus-within:ring-4 focus-within:ring-indigo-100 focus-within:border-indigo-200">
          <div className="pl-4">
            <Search className={`w-6 h-6 ${isLoading ? 'text-indigo-400' : 'text-slate-400'}`} />
          </div>
          <input
            type="text"
            className="w-full py-4 px-4 text-lg text-slate-800 focus:outline-none placeholder:text-slate-400 bg-transparent font-medium"
            placeholder="Cerca prodotto (es. iPhone 15, Frigo LG...)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={handleFocus}
            disabled={isLoading}
          />
          {isSuggesting && (
             <div className="mr-3">
               <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
             </div>
          )}
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`mr-1 px-8 py-3 rounded-full font-bold text-white transition-all duration-300 shadow-lg ${
              isLoading || !input.trim()
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:shadow-indigo-300 hover:scale-[1.02] active:scale-95'
            }`}
          >
            {isLoading ? '...' : 'Cerca'}
          </button>
        </div>
      </form>

      {/* Suggestion Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-6 right-6 mt-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-slate-200/50 border border-white/50 overflow-hidden animate-fade-in-down z-50">
          <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
            {input.trim().length === 0 ? (
                <>
                    <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                    <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Trending Now</span>
                </>
            ) : (
                <>
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Suggerimenti Smart</span>
                </>
            )}
          </div>
          <ul className="py-2">
            {suggestions.map((suggestion, index) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-5 py-3.5 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 transition-colors flex items-center justify-between group"
                >
                  <span className="font-medium text-base">{suggestion}</span>
                  <div className="flex items-center gap-2">
                    {input.trim().length === 0 && (
                        <span className="text-[10px] px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-bold uppercase tracking-wide">New</span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchBar;