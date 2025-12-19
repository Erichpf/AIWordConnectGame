/**
 * AI Service Module
 * Requirements: 8.2, 8.3, 8.4
 * Handles AI content generation with retry and fallback logic
 */
import { WordCard, Language, Level, GameStats } from 'shared';
interface GenerateParams {
    language: Language;
    level: Level;
    theme: string;
    count: number;
}
interface AIGenerateResult {
    success: boolean;
    data: WordCard[];
    error?: string;
}
export declare class AIService {
    private apiKey;
    private apiEndpoint;
    private maxRetries;
    constructor();
    /**
     * Generate word content using AI
     * Requirements: 8.2, 8.3, 8.4
     */
    generateContent(params: GenerateParams): Promise<AIGenerateResult>;
    /**
     * Build prompt for AI model
     * Requirements: 8.2
     */
    buildPrompt(params: GenerateParams): string;
    /**
     * Call AI API
     */
    private callAI;
    /**
     * Parse AI response to WordCard array
     * Requirements: 8.3
     */
    parseResponse(response: string, expectedCount: number): WordCard[];
    /**
     * Validate word response structure
     */
    private isValidWordResponse;
    /**
     * Generate explanation for a word pair
     */
    generateExplanation(word: string, meaning: string, isCorrect: boolean): Promise<string>;
    /**
     * Generate learning summary
     */
    generateSummary(stats: GameStats): Promise<string>;
    /**
     * Generate local summary without AI
     */
    private generateLocalSummary;
}
export {};
