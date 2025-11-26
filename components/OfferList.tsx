import React from 'react';
import { ShoppingCart, TrendingDown, ExternalLink } from 'lucide-react';
import { Offer } from '../types';

interface OfferListProps {
  offers: Offer[];
  bestPrice: number;
}

const OfferList: React.FC<OfferListProps> = ({ offers, bestPrice }) => {
  // Sort by price
  const sortedOffers = [...offers].sort((a, b) => a.price - b.price);

  // Helper per ottenere l'icona del negozio
  const getStoreLogoUrl = (storeName: string) => {
    // Normalizza il nome per indovinare il dominio
    const lowerName = storeName.toLowerCase().trim().replace(/\s+/g, '');
    
    // Mappa manuale per i più comuni se necessario, o fallback generico su .it/.com
    let domain = `${lowerName}.it`;
    if (lowerName.includes('amazon')) domain = 'amazon.it';
    else if (lowerName.includes('ebay')) domain = 'ebay.it';
    else if (lowerName.includes('mediaworld')) domain = 'mediaworld.it';
    else if (lowerName.includes('euronics')) domain = 'euronics.it';
    else if (lowerName.includes('unieuro')) domain = 'unieuro.it';
    else if (lowerName.includes('trony')) domain = 'trony.it';
    else if (lowerName.includes('expert')) domain = 'expert.it';
    else if (lowerName.includes('comet')) domain = 'comet.it';
    else if (lowerName.includes('yeppon')) domain = 'yeppon.it';
    else if (lowerName.includes('onlinestore')) domain = 'onlinestore.it';
    
    // Servizio Google Favicon (molto affidabile)
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800">Dettaglio Offerte Verificate</h3>
        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{offers.length} store trovati</span>
      </div>
      <div className="divide-y divide-slate-100">
        {sortedOffers.map((offer, index) => {
          const isBestPrice = offer.price === bestPrice;
          const logoUrl = getStoreLogoUrl(offer.store);
          
          return (
            <div key={`${offer.store}-${index}`} className={`p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row items-center justify-between gap-4 ${isBestPrice ? 'bg-emerald-50/30' : ''}`}>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                {/* Store Logo Container */}
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 p-2 flex items-center justify-center shadow-sm shrink-0">
                  <img 
                    src={logoUrl} 
                    alt={offer.store}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // Fallback visuale se l'immagine non carica
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.classList.add('bg-slate-100');
                      (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-xs font-bold text-slate-500">${offer.store.substring(0,2).toUpperCase()}</span>`;
                    }}
                  />
                </div>
                
                <div className="flex-grow">
                  <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                    {offer.store}
                    {isBestPrice && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <TrendingDown className="w-3 h-3 mr-1" /> Migliore
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-slate-500 max-w-[200px] sm:max-w-xs truncate">{offer.description || 'Disponibile online'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-right">
                  <span className={`text-xl font-bold ${isBestPrice ? 'text-emerald-600' : 'text-slate-900'}`}>
                    €{offer.price.toFixed(2)}
                  </span>
                </div>
                
                {offer.link ? (
                   <a 
                   href={offer.link} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all shadow-md hover:shadow-lg text-sm font-medium whitespace-nowrap group"
                 >
                   <span>Vedi Offerta</span>
                   <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-white transition-colors" />
                 </a>
                ) : (
                  <button disabled className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-400 rounded-lg cursor-not-allowed text-sm font-medium whitespace-nowrap">
                     Non disponibile
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OfferList;
