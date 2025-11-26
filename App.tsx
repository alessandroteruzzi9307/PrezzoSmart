import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, ShoppingBag, ImageIcon, Zap, ShieldCheck, Star, Trash2, Clock } from 'lucide-react';
import SearchBar from './components/SearchBar';
import PriceChart from './components/PriceChart';
import OfferList from './components/OfferList';
import SourceList from './components/SourceList';
import { searchProductPrices } from './services/geminiService';
import { ProductData, LoadingState, FavoriteItem } from './types';

function App() {
  const [status, setStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [data, setData] = useState<ProductData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [currentQuery, setCurrentQuery] = useState<string>("");

  // Load favorites from localStorage on mount
  useEffect(() => {
    const storedFavs = localStorage.getItem('prezzosmart_favs');
    if (storedFavs) {
      try {
        setFavorites(JSON.parse(storedFavs));
      } catch (e) {
        console.error("Failed to parse favorites", e);
      }
    }
  }, []);

  const saveFavorites = (favs: FavoriteItem[]) => {
    setFavorites(favs);
    localStorage.setItem('prezzosmart_favs', JSON.stringify(favs));
  };

  const toggleFavorite = () => {
    if (!data) return;
    
    // Use the product name from data if available, otherwise the query
    const queryToSave = data.productName || currentQuery;
    const exists = favorites.find(f => f.query === queryToSave);

    let newFavs;
    if (exists) {
      newFavs = favorites.filter(f => f.query !== queryToSave);
    } else {
      newFavs = [{ query: queryToSave, timestamp: Date.now() }, ...favorites];
    }
    saveFavorites(newFavs);
  };

  const removeFavorite = (e: React.MouseEvent, query: string) => {
    e.stopPropagation();
    const newFavs = favorites.filter(f => f.query !== query);
    saveFavorites(newFavs);
  };

  const handleSearch = async (query: string) => {
    setCurrentQuery(query);
    setStatus(LoadingState.LOADING);
    setError(null);
    setData(null);

    try {
      const result = await searchProductPrices(query);
      if (result.offers.length === 0) {
        setError("Non ho trovato offerte verificate con link diretti per questo prodotto. Prova a cercare il nome esatto del modello.");
        setStatus(LoadingState.ERROR);
      } else {
        setData(result);
        setStatus(LoadingState.SUCCESS);
      }
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || "Si è verificato un errore imprevisto durante la ricerca. Riprova.";
      setError(errorMessage);
      setStatus(LoadingState.ERROR);
    }
  };

  const isCurrentFavorite = data ? favorites.some(f => f.query === data.productName) : false;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50/50">
      {/* Modern Hero Header */}
      <header className="relative bg-[#0f172a] text-white pb-32 pt-16 px-4 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[100px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[60%] rounded-full bg-purple-600/20 blur-[100px]"></div>
          <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-emerald-500/10 blur-[80px]"></div>
        </div>

        <div className="max-w-5xl mx-auto flex flex-col items-center text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm mb-6 animate-fade-in-down">
            <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-semibold text-indigo-100 uppercase tracking-wide">AI Powered Price Tracker</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6 drop-shadow-sm">
            Trova il prezzo <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">perfetto</span>.
          </h1>
          
          <p className="text-slate-300 max-w-2xl text-lg md:text-xl leading-relaxed font-light mb-8">
            Il comparatore intelligente che analizza <span className="text-white font-medium">Unieuro, MediaWorld, Amazon</span> e altri store in tempo reale.
          </p>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow px-4 pb-16 -mt-20 relative z-20">
        <SearchBar onSearch={handleSearch} isLoading={status === LoadingState.LOADING} />

        <div className="max-w-6xl mx-auto mt-12">
          {/* Loading State */}
          {status === LoadingState.LOADING && (
            <div className="text-center py-24 animate-fade-in-up">
              <div className="relative w-20 h-20 mx-auto mb-8">
                 <div className="absolute inset-0 border-[6px] border-indigo-100 rounded-full"></div>
                 <div className="absolute inset-0 border-[6px] border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h3 className="text-2xl font-bold text-slate-800">Analisi in corso</h3>
              <p className="text-slate-500 mt-2 text-lg">L'AI sta scansionando i cataloghi...</p>
            </div>
          )}

          {/* Error State */}
          {status === LoadingState.ERROR && (
            <div className="bg-white border-l-4 border-red-500 shadow-xl rounded-2xl p-8 max-w-2xl mx-auto animate-fade-in-down flex items-start gap-6">
              <div className="bg-red-50 p-4 rounded-full shrink-0">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Ops, qualcosa non va.</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
                >
                  Riprova
                </button>
              </div>
            </div>
          )}

          {/* Empty/Idle State with Favorites */}
          {status === LoadingState.IDLE && (
            <div className="text-center py-10 opacity-100 transition-all duration-500">
              
              {favorites.length > 0 && (
                <div className="max-w-4xl mx-auto mb-16 animate-fade-in-up">
                  <h3 className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-6">Le tue ricerche salvate</h3>
                  <div className="flex flex-wrap justify-center gap-3">
                    {favorites.map((fav, idx) => (
                      <div 
                        key={idx}
                        onClick={() => handleSearch(fav.query)}
                        className="group flex items-center gap-3 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-2xl px-5 py-3 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                      >
                         <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <Clock className="w-4 h-4" />
                         </div>
                         <span className="font-semibold text-slate-700 group-hover:text-indigo-900">{fav.query}</span>
                         <button 
                            onClick={(e) => removeFavorite(e, fav.query)}
                            className="p-1.5 hover:bg-red-100 text-slate-400 hover:text-red-500 rounded-full transition-colors ml-2"
                            title="Rimuovi preferito"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="inline-block p-6 rounded-full bg-slate-100 mb-4 opacity-60">
                 <ShoppingBag className="w-12 h-12 text-slate-400" />
              </div>
              <p className="text-slate-400 text-lg font-medium">Cerca un prodotto per iniziare il risparmio.</p>
            </div>
          )}

          {/* Results State */}
          {status === LoadingState.SUCCESS && data && (
            <div className="animate-fade-in-up space-y-10">
              
              {/* Hero Product Card */}
              <div className="bg-white rounded-[2rem] p-8 shadow-2xl shadow-indigo-100/50 border border-white relative overflow-hidden">
                 {/* Decorative background blob */}
                 <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full blur-3xl -z-0 translate-x-1/3 -translate-y-1/3"></div>

                 <div className="relative z-10 flex flex-col md:flex-row gap-10">
                    {/* Product Image */}
                    <div className="w-full md:w-1/3 aspect-square bg-white rounded-2xl border border-slate-100 p-8 flex items-center justify-center shadow-inner group">
                        {data.imageUrl ? (
                          <img 
                            src={data.imageUrl} 
                            alt={data.productName} 
                            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500 ease-out"
                            onError={(e) => {
                               (e.target as HTMLImageElement).style.display = 'none';
                               const fallback = (e.target as HTMLImageElement).parentElement?.querySelector('.fallback-icon');
                               if (fallback) fallback.classList.remove('hidden');
                            }}
                          />
                        ) : (
                          <ImageIcon className="w-24 h-24 text-slate-200" />
                        )}
                        <div className={`fallback-icon absolute inset-0 flex items-center justify-center ${data.imageUrl ? 'hidden' : ''}`}>
                           <ImageIcon className="w-24 h-24 text-slate-200" />
                        </div>
                    </div>

                    {/* Product Details */}
                    <div className="flex-grow flex flex-col justify-center">
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-3">
                              <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-indigo-200">
                                Risultato Migliore
                              </span>
                              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                                  <ShieldCheck className="w-3.5 h-3.5" /> Verificato AI
                              </span>
                           </div>
                           
                           {/* Favorite Button */}
                           <button 
                             onClick={toggleFavorite}
                             className={`p-3 rounded-full transition-all duration-300 group ${
                               isCurrentFavorite 
                                 ? 'bg-yellow-50 text-yellow-500 shadow-inner' 
                                 : 'bg-slate-50 text-slate-400 hover:bg-yellow-50 hover:text-yellow-500'
                             }`}
                             title={isCurrentFavorite ? "Rimuovi dai preferiti" : "Salva ricerca"}
                           >
                              <Star className={`w-6 h-6 transition-transform ${isCurrentFavorite ? 'fill-yellow-500 scale-110' : 'group-hover:scale-110'}`} />
                           </button>
                        </div>
                        
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-3 tracking-tight">
                          {data.productName}
                        </h2>
                        
                        <p className="text-slate-500 text-sm mb-8 flex items-center gap-2">
                           Scansionato alle {data.lastUpdated}
                        </p>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                           <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5 rounded-2xl text-white shadow-lg shadow-emerald-200 transform transition hover:-translate-y-1">
                              <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1">Miglior Prezzo</p>
                              <p className="text-3xl font-bold">€{data.bestPrice.toFixed(2)}</p>
                           </div>
                           <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Prezzo Medio</p>
                              <p className="text-3xl font-bold text-slate-700">€{data.averagePrice.toFixed(2)}</p>
                           </div>
                        </div>
                    </div>
                 </div>
              </div>

              {/* Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Left Column: Analytics */}
                <div className="lg:col-span-1 space-y-6 sticky top-8">
                  <PriceChart offers={data.offers} averagePrice={data.averagePrice} />
                  
                  {/* Smart Insight Card */}
                  <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity"></div>
                    
                    <div className="relative z-10">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-4 backdrop-blur-md">
                           <TrendingUp className="w-5 h-5 text-indigo-300" />
                        </div>
                        <h3 className="text-lg font-bold mb-2">Potenziale Risparmio</h3>
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                          Acquistando al prezzo migliore rispetto alla media di mercato risparmi:
                        </p>
                        <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                          €{(data.averagePrice - data.bestPrice).toFixed(2)}
                        </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Offers */}
                <div className="lg:col-span-2">
                  <OfferList offers={data.offers} bestPrice={data.bestPrice} />
                  <SourceList sources={data.sources} />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <footer className="mt-20 py-12 border-t border-slate-200 bg-white">
         <div className="max-w-6xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                <span className="font-bold text-xl text-slate-800">PrezzoSmart</span>
            </div>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
               PrezzoSmart è un motore di ricerca indipendente. Verificare sempre i prezzi finali sui siti dei venditori prima dell'acquisto.
            </p>
         </div>
      </footer>
    </div>
  );
}

export default App;