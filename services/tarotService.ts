
import { supabase } from './supabaseClient';
import { TarotCard } from '../types';
import { TAROT_DECK as FALLBACK_DECK } from '../constants';

export const TarotService = {
  /**
   * Fetch all tarot cards from Supabase.
   * Maps the DB schema (id, name, url) to the Frontend TarotCard interface.
   */
  async fetchAllCards(): Promise<TarotCard[]> {
    try {
      const { data, error } = await supabase
        .from('tarot_cards')
        .select('*');

      if (error) {
        console.error('Error fetching tarot cards:', error);
        return FALLBACK_DECK; // Fail gracefully to local deck
      }

      if (!data || data.length === 0) {
        return FALLBACK_DECK;
      }

      // Map DB fields to TypeScript Interface
      // Assuming DB has: id, name, url. 
      // We fill missing keywords/meaning with defaults as they might not be in this specific table structure.
      return data.map((item: any) => ({
        id: item.id.toString(),
        name: item.name,
        imageUrl: item.url, 
        keywords: item.keywords || [], // Fallback if column exists or empty array
        meaning: item.meaning || ''    // Fallback if column exists or empty string
      }));

    } catch (e) {
      console.error('Unexpected error fetching cards:', e);
      return FALLBACK_DECK;
    }
  }
};
