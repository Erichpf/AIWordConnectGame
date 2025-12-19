/**
 * Local Word Bank Service
 * Requirements: 5.3
 * Provides fallback word content when AI service is unavailable
 */
import { WordCard, Language, Level } from 'shared';
export declare class LocalWordBank {
    private zhIdioms;
    private enWords;
    constructor();
    private loadWordBank;
    /**
     * Get words from local word bank
     * @param language Language mode (zh or en)
     * @param level Difficulty level (affects word selection)
     * @param theme Theme category
     * @param count Number of word pairs needed
     * @returns Array of WordCards (word + meaning pairs)
     */
    getWords(language: Language, level: Level, theme: string, count: number): WordCard[];
    /**
     * Create WordCard pairs from word entries
     * Each word entry becomes two cards: one for word, one for meaning
     */
    private createWordCardPairs;
    /**
     * Fisher-Yates shuffle algorithm
     */
    private shuffleArray;
    /**
     * Get available themes for a language
     */
    getAvailableThemes(language: Language): string[];
}
