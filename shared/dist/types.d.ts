/**
 * 智连词境 - AI Word Connect Game
 * Shared Type Definitions
 */
/**
 * 语言模式
 */
export type Language = 'zh' | 'en';
/**
 * 难度等级
 */
export type Level = 'easy' | 'medium' | 'hard';
/**
 * 卡片类型
 */
export type CardType = 'word' | 'meaning';
/**
 * 词卡接口
 * Requirements: 5.2, 8.5
 */
export interface WordCard {
    /** 唯一标识 */
    id: string;
    /** 词语/单词 */
    word: string;
    /** 释义 */
    meaning: string;
    /** 学习提示 */
    hint: string;
    /** 易混淆词（可选） */
    confuse?: string;
    /** 卡片类型：word 或 meaning */
    type: CardType;
    /** 配对 ID，相同 pairId 的两张卡片为一对 */
    pairId: string;
}
/**
 * 位置接口
 */
export interface Position {
    row: number;
    col: number;
}
/**
 * 路径接口
 */
export interface Path {
    /** 路径上的所有点 */
    points: Position[];
    /** 拐点数量 */
    turns: number;
}
/**
 * 棋盘状态接口
 */
export interface BoardState {
    /** 棋盘网格，null 表示空位 */
    grid: (WordCard | null)[][];
    /** 行数 */
    rows: number;
    /** 列数 */
    cols: number;
}
/**
 * 棋盘尺寸配置
 */
export interface BoardSize {
    rows: number;
    cols: number;
}
/**
 * 游戏配置接口
 */
export interface GameConfig {
    /** 语言模式 */
    language: Language;
    /** 难度等级 */
    level: Level;
    /** 主题 */
    theme: string;
    /** 棋盘尺寸 */
    boardSize: BoardSize;
}
/**
 * 游戏分数
 */
export interface GameScore {
    /** 正确匹配数 */
    correct: number;
    /** 错误匹配数 */
    wrong: number;
}
/**
 * 游戏状态接口
 */
export interface GameState {
    /** 游戏配置 */
    config: GameConfig;
    /** 棋盘状态 */
    board: BoardState;
    /** 分数 */
    score: GameScore;
    /** 已用时间（秒） */
    elapsedTime: number;
    /** 当前选中的卡片位置 */
    selectedCard: Position | null;
    /** 游戏是否完成 */
    isComplete: boolean;
}
/**
 * 匹配记录
 */
export interface MatchRecord {
    /** 词语 */
    word: string;
    /** 释义 */
    meaning: string;
    /** 是否匹配正确 */
    isCorrect: boolean;
    /** 时间戳 */
    timestamp: number;
}
/**
 * 游戏结果
 */
export interface GameResult {
    /** 正确匹配数 */
    correct: number;
    /** 错误匹配数 */
    wrong: number;
    /** 游戏时长（秒） */
    duration: number;
    /** 匹配历史 */
    matchHistory: MatchRecord[];
}
/**
 * 词语生成请求
 */
export interface GenerateRequest {
    /** 语言模式 */
    language: Language;
    /** 难度等级 */
    level: Level;
    /** 主题 */
    theme: string;
    /** 需要生成的词对数量 */
    count: number;
}
/**
 * 词语生成响应
 */
export interface GenerateResponse {
    /** 是否成功 */
    success: boolean;
    /** 词卡数据 */
    data: WordCard[];
    /** 数据来源：ai 或 local */
    source: 'ai' | 'local';
}
/**
 * 错误响应
 */
export interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
}
/**
 * 游戏统计
 */
export interface GameStats {
    /** 正确匹配数 */
    correct: number;
    /** 错误匹配数 */
    wrong: number;
    /** 游戏时长（秒） */
    duration: number;
    /** 匹配历史 */
    matchHistory: MatchRecord[];
}
/**
 * 匹配失败原因
 */
export type MatchFailureReason = 'invalid_path' | 'content_mismatch';
/**
 * 匹配结果
 */
export interface MatchResult {
    /** 是否匹配成功 */
    success: boolean;
    /** 失败原因（仅在失败时存在） */
    failureReason?: MatchFailureReason;
    /** 连接路径（仅在路径有效时存在） */
    path?: Path;
}
/**
 * 难度调整方向
 */
export type DifficultyAdjustment = 'increase' | 'decrease' | 'none';
/**
 * 难度调整状态
 */
export interface DifficultyState {
    /** 连续正确次数 */
    consecutiveCorrect: number;
    /** 连续错误次数 */
    consecutiveWrong: number;
    /** 上次操作时间 */
    lastActionTime: number;
}
//# sourceMappingURL=types.d.ts.map