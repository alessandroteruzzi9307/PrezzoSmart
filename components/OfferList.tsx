import React from 'react';
import { ShoppingCart, TrendingDown, ExternalLink, ShieldCheck } from 'lucide-react';
import { Offer } from '../types';

interface OfferListProps {
  offers: Offer[];
  bestPrice: number;
}

const OfferList: React.FC<OfferListProps> = ({ offers, bestPrice }) => {
  const sortedOffers = [...offers].sort((a, b) => a.price - b.price);

  const getStoreLogoUrl = (storeName: string) => {
    const lowerName = storeName.toLowerCase().trim().replace(/\s+/g, '');
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
    
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xl font-bold text-slate-900">Migliori Offerte</h3>
        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
          {offers.length} store trovati
        </span>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {sortedOffers.map((offer, index) => {
          const isBestPrice = offer.price === bestPrice;
          const logoUrl = getStoreLogoUrl(offer.store);
          
          return (
            <div 
              key={`${offer.store}-${index}`} 
              className={`relative bg-white rounded-2xl p-5 border transition-all duration-300 flex flex-col sm:flex-row items-center gap-6 group
                ${isBestPrice 
                  ? 'border-emerald-200 shadow-lg shadow-emerald-50 z-10 scale-[1.01]' 
                  : 'border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100'
                }`}
            >
              {/* Badge Miglior Prezzo */}
              {isBestPrice && (
                <div className="absolute -top-3 left-6 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  <TrendingDown className="w-3 h-3" /> BEST PRICE
                </div>
              )}

              {/* Logo Store */}
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 p-3 flex items-center justify-center shadow-sm shrink-0">
                <img 
                  src={logoUrl} 
                  alt={offer.store}
                  className="w-full h-full object-contain filter group-hover:brightness-110 transition-all"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.classList.add('bg-slate-100');
                    (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-xs font-bold text-slate-400">${offer.store.substring(0,2).toUpperCase()}</span>`;
                  }}
                />
              </div>

              {/* Info */}
              <div className="flex-grow text-center sm:text-left">
                <h4 className="font-bold text-slate-800 text-lg">{offer.store}</h4>
                <p className="text-sm text-slate-500 flex items-center justify-center sm:justify-start gap-1">
                   {offer.description || 'Disponibile online'}
                   {isBestPrice && <ShieldCheck className="w-3 h-3 text-emerald-500" />}
                </p>
              </div>

              {/* Prezzo e Azione */}
              <div className="flex flex-col items-center sm:items-end gap-3 w-full sm:w-auto">
                <div className="text-right">
                  <span className={`text-2xl font-bold tracking-tight ${isBestPrice ? 'text-emerald-600' : 'text-slate-900'}`}>
                    €{offer.price.toFixed(2)}
                  </span>
                </div>
                
                {offer.link ? (
                   <a 
                   href={offer.link} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md w-full sm:w-auto
                     ${isBestPrice 
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-emerald-200' 
                        : 'bg-slate-900 text-white hover:bg-indigo-600 hover:shadow-indigo-200'
                     }`}
                 >
                   Vedi Offerta <ExternalLink className="w-3 h-3 opacity-70" />
                 </a>
                ) : (
                  <button disabled className="px-6 py-2 bg-slate-100 text-slate-400 rounded-xl text-sm font-bold cursor-not-allowed w-full sm:w-auto">
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