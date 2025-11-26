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

    OBIETTIVO: Trovare il codice modello esatto (SKU) e i prezzi attuali per costruire link di acquisto funzionanti.

    ISTRUZIONI CRITICHE PER I LINK:
    I siti come MediaWorld o Unieuro falliscono se cerchi frasi lunghe o imprecise.
    Devi estrarre una "cleanSearchQuery" OTTIMIZZATA PER I MOTORI DI RICERCA INTERNI.
    
    REGOLE CLEAN SEARCH QUERY:
    1. Se è uno smartphone/PC famoso: "Brand + Modello Base" (es. "Samsung S25 Ultra", "iPhone 15 128GB"). NON mettere colori.
    2. Se è un elettrodomestico (frigo, lavatrice): SOLO il CODICE MODELLO (es. "LNT3LF18S").
    3. Se è un accessorio: "Nome esatto breve" (es. "Apple AirTag", "DualSense PS5").
    
    IMPORTANTE: Se il prodotto richiesto non esiste ancora (es. S25, Pixel 10), cerca il modello più recente ESISTENTE (es. S24, Pixel 9) o indica chiaramente il modello futuro per la ricerca generica.

    PASSI:
    1. Identifica il modello esatto e il codice SKU.
    2. Cerca i prezzi sui siti italiani (Amazon, Unieuro, MediaWorld, Euronics, ecc).
    3. Genera la "cleanSearchQuery".

    OUTPUT RICHIESTO (JSON PURO):
    {
      "productName": "Nome completo commerciale (es. Samsung Galaxy S25 Ultra 512GB)",
      "cleanSearchQuery": "STRINGA PER RICERCA STORE (es. Samsung S25 Ultra)",
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
      .filter((web: any) => web && web && web.uri && web.title)
      .map((web: any) => ({ title: web.title, uri: web.uri }));

    const validOffers: any[] = [];
    const rawOffers = parsedData.offers || [];
    
    // DEFINIZIONE CHIAVE DI RICERCA OTTIMIZZATA
    let searchKey = parsedData.cleanSearchQuery;
    
    if (!searchKey || searchKey.length < 2) {
        // Fallback: prendi le prime 3 parole del nome prodotto
        searchKey = (parsedData.productName || query).split(' ').slice(0, 3).join(' ');
    }

    const encodedKey = encodeURIComponent(searchKey.trim());
    // E-commerce legacy spesso preferiscono + al posto di %20
    const encodedKeyPlus = searchKey.trim().replace(/\s+/g, '+');

    // CONFIGURAZIONE URL RICERCA STORE (Aggiornata per risolvere 404)
    const storeConfigs: {[key: string]: {keywords: string[], searchUrl: string}} = {
      'amazon': { 
        keywords: ['amazon'], 
        searchUrl: `https://www.amazon.it/s?k=${encodedKey}` 
      },
      'mediaworld': { 
        keywords: ['mediaworld', 'media world'], 
        // Funzionante: search.html?query=
        searchUrl: `https://www.mediaworld.it/it/search.html?query=${encodedKey}` 
      },
      'unieuro': { 
        keywords: ['unieuro'], 
        // FIX: Usiamo + per gli spazi e rimuoviamo online/search se necessario, ma online/search è standard.
        // Proviamo la versione più pulita possibile. Unieuro spesso 404 se ci sono troppe parole.
        searchUrl: `https://www.unieuro.it/online/search?q=${encodedKey}` 
      },
      'euronics': { 
        keywords: ['euronics'], 
        // FIX: Nuovo pattern Euronics
        searchUrl: `https://www.euronics.it/search.html?q=${encodedKey}` 
      },
      'expert': { 
        keywords: ['expert'], 
        // FIX: Semplificato da /it/it/exp...
        searchUrl: `https://www.expert.it/ricerca?q=${encodedKeyPlus}` 
      },
      'trony': { 
        keywords: ['trony'], 
        // FIX: Trony standard
        searchUrl: `https://www.trony.it/online/search?q=${encodedKey}` 
      },
      'comet': { 
        keywords: ['comet'], 
        searchUrl: `https://www.comet.it/search?q=${encodedKey}` 
      },
      'ebay': { 
        keywords: ['ebay'], 
        searchUrl: `https://www.ebay.it/sch/i.html?_nkw=${encodedKey}` 
      },
      'monclick': { 
        keywords: ['monclick'], 
        searchUrl: `https://www.monclick.it/ricerca?q=${encodedKey}` 
      },
      'eprice': { 
        keywords: ['eprice'], 
        searchUrl: `https://www.eprice.it/search?q=${encodedKey}` 
      },
      'yeppon': { 
        keywords: ['yeppon'], 
        searchUrl: `https://www.yeppon.it/cerca?q=${encodedKey}` 
      }
    };

    for (const offer of rawOffers) {
      // 1. Price Parsing Robustness
      let price = offer.price;
      if (typeof price === 'string') {
          let cleanPrice = price.replace(/[^0-9.,]/g, '').trim();
          if (cleanPrice.includes(',') && cleanPrice.includes('.')) {
              // Guess format: 1.200,00 vs 1,200.00
              if (cleanPrice.indexOf('.') < cleanPrice.indexOf(',')) {
                   cleanPrice = cleanPrice.replace(/\./g, '').replace(',', '.'); // IT format
              } else {
                   cleanPrice = cleanPrice.replace(/,/g, ''); // US format
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
      
      const configKey = Object.keys(storeConfigs).find(k => 
        storeNameLower.includes(k) || storeConfigs[k].keywords.some(kw => storeNameLower.includes(kw))
      );

      // 3. Link Strategy
      // Priority 1: Direct grounding link matching the store domain EXACTLY
      const matchingSource = sources.find(s => {
        const uri = s.uri.toLowerCase();
        return configKey && uri.includes(configKey);
      });

      if (matchingSource) {
        finalLink = matchingSource.uri;
      } else if (configKey) {
        // Priority 2: Generated Search Link with Optimized Key (The Safe Fallback)
        finalLink = storeConfigs[configKey].searchUrl;
      } else {
        // Priority 3: Generic Google Search fallback
        finalLink = `https://www.google.com/search?q=${encodeURIComponent(offer.store + " " + searchKey)}`;
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
    if (!finalImageUrl || typeof finalImageUrl !== 'string' || !finalImageUrl.startsWith('http')) {
        finalImageUrl = null;
    }

    return {
      productName: parsedData.productName || query,
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