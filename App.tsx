import React, { useState } from 'react';
import { Store, TrendingUp, AlertCircle, ShoppingBag, ImageIcon } from 'lucide-react';
import SearchBar from './components/SearchBar';
import PriceChart from './components/PriceChart';
import OfferList from './components/OfferList';
import SourceList from './components/SourceList';
import { searchProductPrices } from './services/geminiService';
import { ProductData, LoadingState } from './types';

function App() {
  const [status, setStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [data, setData] = useState<ProductData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (query: string) => {
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header Section */}
      <header className="bg-slate-900 pb-24 pt-10 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center pointer-events-none"></div>
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl shadow-lg transform -rotate-6">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">PrezzoSmart Italia</h1>
          </div>
          <p className="text-slate-300 max-w-xl text-lg leading-relaxed">
            Il motore di ricerca intelligente che scova le migliori offerte di elettronica su <span className="text-white font-medium">Unieuro, MediaWorld, Amazon</span> e altri.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow px-4 pb-12 -mt-12 relative z-20">
        <SearchBar onSearch={handleSearch} isLoading={status === LoadingState.LOADING} />

        <div className="max-w-6xl mx-auto mt-12">
          {/* Loading State */}
          {status === LoadingState.LOADING && (
            <div className="text-center py-20 animate-fade-in-up">
              <div className="relative w-16 h-16 mx-auto mb-6">
                 <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                 <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h3 className="text-xl font-medium text-slate-800">Analisi in corso...</h3>
              <p className="text-slate-500 mt-2">Sto confrontando i prezzi sui principali cataloghi italiani.</p>
            </div>
          )}

          {/* Error State */}
          {status === LoadingState.ERROR && (
            <div className="bg-white border border-red-100 shadow-xl shadow-red-50 rounded-2xl p-8 text-center max-w-xl mx-auto animate-fade-in-down">
              <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-red-900 mb-2">Ricerca non riuscita</h3>
              <p className="text-slate-600 mb-6">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="text-indigo-600 font-medium hover:text-indigo-800 hover:underline"
              >
                Ricarica la pagina e riprova
              </button>
            </div>
          )}

          {/* Empty/Idle State */}
          {status === LoadingState.IDLE && (
            <div className="text-center py-20 opacity-60">
              <Store className="w-20 h-20 text-slate-200 mx-auto mb-6" />
              <p className="text-slate-400 text-xl font-light">Cerca un prodotto per visualizzare il report prezzi.</p>
            </div>
          )}

          {/* Results State */}
          {status === LoadingState.SUCCESS && data && (
            <div className="animate-fade-in-up space-y-8">
              
              {/* Product Header Card */}
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row gap-8 md:items-stretch">
                 
                 {/* Product Image - Larger and nicer */}
                 <div className="w-full md:w-1/3 min-h-[250px] bg-slate-50 rounded-2xl border border-slate-100 p-6 flex items-center justify-center relative group overflow-hidden">
                    {data.imageUrl ? (
                      <img 
                        src={data.imageUrl} 
                        alt={data.productName} 
                        className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                           (e.target as HTMLImageElement).style.display = 'none';
                           const fallback = (e.target as HTMLImageElement).parentElement?.querySelector('.fallback-icon');
                           if (fallback) fallback.classList.remove('hidden');
                        }}
                      />
                    ) : (
                      <ImageIcon className="w-20 h-20 text-slate-300" />
                    )}
                    <div className={`fallback-icon absolute inset-0 flex items-center justify-center ${data.imageUrl ? 'hidden' : ''}`}>
                       <ImageIcon className="w-20 h-20 text-slate-300 opacity-50" />
                    </div>
                 </div>

                 {/* Product Info */}
                 <div className="flex-grow flex flex-col justify-center">
                    <div>
                      <div className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold tracking-wide uppercase mb-3">
                        Report Comparativo
                      </div>
                      <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-2">{data.productName}</h2>
                      <p className="text-slate-500 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Aggiornato alle {data.lastUpdated}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-8">
                       <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                          <p className="text-xs text-emerald-600 uppercase font-bold tracking-wider mb-1">Miglior Prezzo</p>
                          <p className="text-3xl md:text-4xl font-bold text-emerald-700">€{data.bestPrice.toFixed(2)}</p>
                       </div>
                       <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Prezzo Medio</p>
                          <p className="text-3xl md:text-4xl font-bold text-slate-700">€{data.averagePrice.toFixed(2)}</p>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Chart & Stats */}
                <div className="lg:col-span-1 space-y-6">
                  <PriceChart offers={data.offers} averagePrice={data.averagePrice} />
                  
                  {/* Savings Card */}
                  <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                    <TrendingUp className="w-32 h-32 absolute -right-8 -bottom-8 text-white opacity-10 rotate-12" />
                    <h3 className="text-xl font-bold mb-2 relative z-10">Analisi Risparmio</h3>
                    <div className="text-indigo-100 text-sm mb-6 relative z-10 leading-relaxed">
                      Scegliendo l'offerta migliore risparmi circa:
                    </div>
                    <div className="text-4xl font-bold relative z-10">
                      €{(data.averagePrice - data.bestPrice).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Right Column: Offer List */}
                <div className="lg:col-span-2 space-y-6">
                  <OfferList offers={data.offers} bestPrice={data.bestPrice} />
                  <SourceList sources={data.sources} />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <footer className="bg-white border-t border-slate-100 py-12">
         <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-slate-900 font-semibold mb-2">PrezzoSmart Italia</p>
            <p className="text-slate-400 text-sm">
               Il servizio utilizza l'intelligenza artificiale per aggregare dati pubblici.<br/>
               Verifica sempre il prezzo finale sul sito del venditore.
            </p>
         </div>
      </footer>
    </div>
  );
}

export default App;