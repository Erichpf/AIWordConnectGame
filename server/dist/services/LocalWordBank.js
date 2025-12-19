/**
 * Local Word Bank Service
 * Requirements: 5.3
 * Provides fallback word content when AI service is unavailable
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export class LocalWordBank {
    constructor() {
        this.zhIdioms = this.loadWordBank('zh-idioms.json');
        this.enWords = this.loadWordBank('en-words.json');
    }
    loadWordBank(filename) {
        try {
            const filePath = join(__dirname, '..', 'data', filename);
            const content = readFileSync(filePath, 'utf-8');
            return JSON.parse(content);
        }
        catch (error) {
            console.error(`Failed to load word bank: ${filename}`, error);
            return {};
        }
    }
    /**
     * Get words from local word bank
     * @param language Language mode (zh or en)
     * @param level Difficulty level (affects word selection)
     * @param theme Theme category
     * @param count Number of word pairs needed
     * @returns Array of WordCards (word + meaning pairs)
     */
    getWords(language, level, theme, count) {
        const wordBank = language === 'zh' ? this.zhIdioms : this.enWords;
        const normalizedTheme = theme.toLowerCase();
        // Get words from the specified theme, or fall back to all themes
        let availableWords = [];
        if (wordBank[normalizedTheme]) {
            availableWords = [...wordBank[normalizedTheme]];
        }
        else {
            // Combine all themes if specified theme not found
            for (const themeWords of Object.values(wordBank)) {
                availableWords.push(...themeWords);
            }
        }
        // Shuffle and select required number of words
        const shuffled = this.shuffleArray(availableWords);
        const selectedWords = shuffled.slice(0, count);
        // If not enough words, repeat from the beginning
        while (selectedWords.length < count && availableWords.length > 0) {
            const additionalWords = this.shuffleArray([...availableWords]);
            selectedWords.push(...additionalWords.slice(0, count - selectedWords.length));
        }
        // Convert to WordCard pairs
        return this.createWordCardPairs(selectedWords.slice(0, count));
    }
    /**
     * Create WordCard pairs from word entries
     * Each word entry becomes two cards: one for word, one for meaning
     */
    createWordCardPairs(entries) {
        const cards = [];
        entries.forEach((entry, index) => {
            const pairId = `pair_${index}_${Date.now()}`;
            // Word card
            cards.push({
                id: `word_${pairId}`,
                word: entry.word,
                meaning: entry.meaning,
                hint: entry.hint,
                confuse: entry.confuse,
                type: 'word',
                pairId
            });
            // Meaning card
            cards.push({
                id: `meaning_${pairId}`,
                word: entry.word,
                meaning: entry.meaning,
                hint: entry.hint,
                confuse: entry.confuse,
                type: 'meaning',
                pairId
            });
        });
        return cards;
    }
    /**
     * Fisher-Yates shuffle algorithm
     */
    shuffleArray(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
    /**
     * Get available themes for a language
     */
    getAvailableThemes(language) {
        const wordBank = language === 'zh' ? this.zhIdioms : this.enWords;
        return Object.keys(wordBank);
    }
}
