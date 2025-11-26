import { GoogleGenAI, Tool } from "@google/genai";
import { ProductData, GroundingSource } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Funzione helper per estrarre JSON dalla risposta con pulizia aggressiva
const extractJSON = (text: string): any => {
  try {
    // Rimuovi blocchi markdown se presenti
    let cleanText = text.replace(/```json/g, '').replace(/```/g, '');
    
    const startIndex = cleanText.indexOf('{');
    const endIndex = cleanText.lastIndexOf('}');
    
    if (startIndex !== -1 && endIndex !== -1) {
      return JSON.parse(cleanText.substring(startIndex, endIndex + 1));
    }
    
    // Fallback per array
    const startArr = cleanText.indexOf('[');
    const endArr = cleanText.lastIndexOf(']');
    if (startArr !== -1 && endArr !== -1) {
      return JSON.parse(cleanText.substring(startArr, endArr + 1));
    }
    
    throw new Error("Struttura JSON non trovata nel testo generato");
  } catch (e) {
    console.error("JSON Parse Error. Raw Text:", text);
    throw e;
  }
};

export const getSearchSuggestions = async (partialQuery: string): Promise<string[]> => {
  // Permetti query lunghe (es. "Novità tech") anche se l'input utente è vuoto
  if (partialQuery.length < 3) return [];

  const modelId = "gemini-2.5-flash";
  const prompt = `
    Sei un assistente esperto in tecnologia ed elettronica di consumo.
    Contesto: L'utente sta digitando o cercando: "${partialQuery}".
    
    Obiettivo: Restituisci un array JSON di 5 suggerimenti di prodotti SPECIFICI.
    
    CRITERI DI ORDINAMENTO FONDAMENTALI:
    1. NOVITÀ E FUTURO: Dai SEMPRE priorità assoluta ai modelli più recenti (2024, 2025) e alle prossime uscite flaghsip.
    2. ESEMPI: 
       - Se la query è "Samsung", suggerisci prima "Samsung Galaxy S25" o "S24 Ultra" piuttosto che S20.
       - Se la query è "iPhone", suggerisci "iPhone 16" o "15 Pro".
    3. TRENDING: Se la query riguarda "novità" o "tech", elenca i prodotti più desiderati del momento.
    
    Output: Solo un array JSON di stringhe (es. ["Nome Prodotto 1", "Nome Prodotto 2"]). Nessun markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "[]";
    const suggestions = extractJSON(text);
    return Array.isArray(suggestions) ? suggestions.slice(0, 5) : [];
  } catch (error) {
    return [];
  }
};

export const searchProductPrices = async (query: string): Promise<ProductData> => {
  const modelId = "gemini-2.5-flash";
  const tools: Tool[] = [{ googleSearch: {} }];

  const prompt = `
    Sei PrezzoSmart, un comparatore prezzi tecnico e preciso.
    
    RICERCA UTENTE: "${query}"

    OBIETTIVO: Trovare il codice modello esatto (SKU) e i prezzi attuali.

    PASSI OBBLIGATORI:
    1. IDENTIFICAZIONE MODELLO:
       - Se la ricerca è generica (es. "Frigo Electrolux"), scegli il modello BEST SELLER del 2024/2025.
       - ESTRAI IL CODICE TECNICO (SKU). Esempio: per "Samsung S24", il codice è "S24" o "SM-S921". Per un frigo è tipo "LNT3LF18S".
       - Questo codice serve per cercare sui siti dei negozi che non capiscono descrizioni lunghe.

    2. RICERCA PREZZI:
       - Cerca i prezzi su Amazon, Unieuro, MediaWorld, Euronics, Trony, Expert.
       - Prendi il prezzo più basso attuale.

    3. IMMAGINE:
       - Cerca un URL di immagine valido (jpg/png/webp) dai risultati di ricerca.

    OUTPUT RICHIESTO (JSON PURO):
    {
      "productName": "Nome completo commerciale (es. Samsung Galaxy S25 Ultra 512GB)",
      "modelCode": "SOLO IL CODICE TECNICO PULITO (es. LNT3LF18S o S25-ULTRA)",
      "imageUrl": "URL immagine (se trovata)",
      "offers": [
        { 
          "store": "Nome Store (es. Unieuro)", 
          "price": "prezzo numero (es 499.00)", 
          "description": "Info extra (es. 512GB, Silver)"
        }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: tools,
        temperature: 0.1,
      },
    });

    const text = response.text || "";
    let parsedData: any = {};
    
    try {
      parsedData = extractJSON(text);
    } catch (e) {
      console.error("Errore parsing primario:", e);
      throw new Error("Impossibile analizzare le offerte per questo prodotto.");
    }

    // Estrazione Fonti (Grounding)
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = groundingChunks
      .map((chunk: any) => chunk.web)
      .filter((web: any) => web && web.uri && web.title)
      .map((web: any) => ({ title: web.title, uri: web.uri }));

    const validOffers: any[] = [];
    const rawOffers = parsedData.offers || [];
    
    // CRITICO: Usa il modelCode (SKU) per i link di ricerca, è molto più affidabile sui siti come Unieuro/Mediaworld
    // Se modelCode non c'è, usa productName ma prova a pulirlo
    const modelSku = parsedData.modelCode && parsedData.modelCode.length > 2 
                     ? parsedData.modelCode 
                     : (parsedData.productName || query).split(' ').slice(0, 3).join(' '); // Fallback: prime 3 parole

    const encodedSku = encodeURIComponent(modelSku.trim());

    // Mappa di domini e URL di ricerca OTTIMIZZATI per SKU
    const storeConfigs: {[key: string]: {keywords: string[], searchUrl: string}} = {
      'amazon': { keywords: ['amazon'], searchUrl: `https://www.amazon.it/s?k=${encodedSku}` },
      'mediaworld': { keywords: ['mediaworld'], searchUrl: `https://www.mediaworld.it/it/search/${encodedSku}` },
      'unieuro': { keywords: ['unieuro'], searchUrl: `https://www.unieuro.it/online/search?q=${encodedSku}` },
      'euronics': { keywords: ['euronics'], searchUrl: `https://www.euronics.it/ricerca?q=${encodedSku}` },
      'expert': { keywords: ['expert'], searchUrl: `https://www.expert.it/it/it/exp/search/?text=${encodedSku}` },
      'trony': { keywords: ['trony'], searchUrl: `https://www.trony.it/online/search?q=${encodedSku}` },
      'comet': { keywords: ['comet'], searchUrl: `https://www.comet.it/search?q=${encodedSku}` },
      'ebay': { keywords: ['ebay'], searchUrl: `https://www.ebay.it/sch/i.html?_nkw=${encodedSku}` },
      'monclick': { keywords: ['monclick'], searchUrl: `https://www.monclick.it/ricerca?q=${encodedSku}` },
      'eprice': { keywords: ['eprice'], searchUrl: `https://www.eprice.it/search?q=${encodedSku}` },
      'yeppon': { keywords: ['yeppon'], searchUrl: `https://www.yeppon.it/cerca?q=${encodedSku}` }
    };

    for (const offer of rawOffers) {
      // 1. Price Parsing Robustness
      let price = offer.price;
      if (typeof price === 'string') {
          let cleanPrice = price.replace(/[^0-9.,]/g, '').trim();
          if (cleanPrice.includes(',') && cleanPrice.includes('.')) {
              // Gestione formato europeo vs americano misto
              if (cleanPrice.indexOf('.') < cleanPrice.indexOf(',')) {
                   cleanPrice = cleanPrice.replace(/\./g, '').replace(',', '.');
              } else {
                   cleanPrice = cleanPrice.replace(/,/g, '');
              }
          } else if (cleanPrice.includes(',')) {
              cleanPrice = cleanPrice.replace(',', '.');
          }
          price = parseFloat(cleanPrice);
      }

      if (isNaN(price) || price <= 0) continue;

      // 2. Identification of Store
      const storeNameLower = offer.store.toLowerCase().trim();
      let finalLink = "";
      
      // Find the config key
      const configKey = Object.keys(storeConfigs).find(k => 
        storeNameLower.includes(k) || storeConfigs[k].keywords.some(kw => storeNameLower.includes(kw))
      );

      // 3. Link Strategy
      // Try to find a direct grounding link first
      const matchingSource = sources.find(s => {
        const uri = s.uri.toLowerCase();
        const title = s.title.toLowerCase();
        return (configKey && uri.includes(configKey)) || 
               uri.includes(storeNameLower.replace(/\s/g, '')) || 
               title.includes(storeNameLower);
      });

      if (matchingSource) {
        finalLink = matchingSource.uri;
      } else if (configKey) {
        // Fallback: Use the generated search link with the SKU (High Success Rate)
        finalLink = storeConfigs[configKey].searchUrl;
      } else {
        // Generic fallback
        finalLink = `https://www.google.com/search?q=${encodeURIComponent(offer.store + " " + modelSku)}`;
      }

      validOffers.push({
        store: offer.store,
        price: price,
        description: offer.description,
        link: finalLink
      });
    }

    if (validOffers.length === 0) {
      throw new Error("Nessuna offerta trovata. Prova a specificare meglio il modello.");
    }

    const prices = validOffers.map((o: any) => o.price);
    const bestPrice = Math.min(...prices);
    const averagePrice = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;

    let finalImageUrl = parsedData.imageUrl;
    // Basic validation for image url
    if (!finalImageUrl || typeof finalImageUrl !== 'string' || !finalImageUrl.startsWith('http')) {
        finalImageUrl = null;
    }

    return {
      productName: parsedData.productName || modelSku,
      imageUrl: finalImageUrl,
      offers: validOffers,
      bestPrice,
      averagePrice,
      lastUpdated: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      sources: sources
    };

  } catch (error) {
    console.error("Gemini Service Error:", error);
    throw error;
  }
};