import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Sparkles, Flame } from 'lucide-react';
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
  
  // FIX: Use ReturnType<typeof setTimeout> for browser compatibility
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Chiudi suggerimenti se clicchi fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Gestione Input con Debounce per i suggerimenti
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Se l'input è vuoto, carica le novità/trending
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
      // Tra 0 e 2 caratteri, aspetta o non fare nulla se non vuoto
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
     // Se abbiamo già suggerimenti (trending o altro), mostrali
     if (suggestions.length > 0) {
        setShowSuggestions(true);
     } else if (input.trim().length === 0) {
        // Se non abbiamo suggerimenti e input vuoto, triggera il fetch immediato (anche se useEffect lo farà)
        // Questo serve per feedback immediato se useEffect non è ancora scattato
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
    <div className="w-full max-w-3xl mx-auto -mt-8 relative z-50 px-4" ref={containerRef}>
      <form onSubmit={handleSubmit} className="relative shadow-xl rounded-2xl bg-white border border-slate-100 transition-all focus-within:ring-2 focus-within:ring-indigo-100">
        <div className="flex items-center p-2">
          <Search className="w-6 h-6 text-slate-400 ml-4 shrink-0" />
          <input
            type="text"
            className="w-full p-4 text-lg text-slate-800 focus:outline-none placeholder:text-slate-400 rounded-xl bg-transparent"
            placeholder="Cerca un prodotto (es. Samsung S25, Frigo...)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={handleFocus}
            disabled={isLoading}
          />
          {isSuggesting && (
             <div className="mr-2 animate-pulse">
               <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
             </div>
          )}
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`mr-2 px-6 sm:px-8 py-3 rounded-xl font-semibold text-white transition-all duration-200 shrink-0 ${
              isLoading || !input.trim()
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:scale-95'
            }`}
          >
            {isLoading ? 'Ricerca...' : 'Trova'}
          </button>
        </div>
      </form>

      {/* Suggestion Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-4 right-4 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden animate-fade-in-down">
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
            {input.trim().length === 0 ? (
                <>
                    <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                    <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider">In Evidenza & Novità</span>
                </>
            ) : (
                <>
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Modelli Consigliati</span>
                </>
            )}
          </div>
          <ul>
            {suggestions.map((suggestion, index) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-3 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 transition-colors flex items-center gap-3 group"
                >
                  <Search className="w-4 h-4 text-slate-300 group-hover:text-indigo-400" />
                  <span className="font-medium">{suggestion}</span>
                  {input.trim().length === 0 && (
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-full font-bold">NEW</span>
                  )}
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