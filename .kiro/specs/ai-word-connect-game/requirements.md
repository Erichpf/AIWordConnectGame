# Requirements Document

## Introduction

智连词境（AI Word Connect Game）是一个基于 AI 内容生成与智能教学反馈的网页端词语连连看学习游戏。通过游戏化机制提升用户对词汇（成语/英文单词）的理解、辨析与记忆能力。核心特点是将传统连连看升级为"可教学的智能游戏"，用 AI 解决词汇学习中"死记硬背、缺乏反馈"的问题。

**项目目标：** 本地可运行的完整功能 Demo，专注于核心游戏体验和 AI 教学功能。

## Glossary

- **Board**: 游戏棋盘，由多个格子组成的矩形区域，用于放置词卡
- **WordCard**: 词卡，包含词语或释义的游戏卡片
- **Match**: 匹配，将词语与其正确释义配对的操作
- **Path**: 连接路径，两张卡片之间的连线，最多允许 2 个拐点
- **Turn**: 拐点，路径改变方向的点
- **AI Service**: AI 服务模块，负责生成词库、提供学习讲解和总结
- **Level**: 难度等级，分为 easy（初级）、medium（中级）、hard（高级）
- **Theme**: 主题，如学习、品德、成长、科技等分类
- **Language Mode**: 语言模式，支持中文成语和英文词汇两种模式

## Requirements

### Requirement 1

**User Story:** As a player, I want to select game settings before starting, so that I can customize my learning experience.

#### Acceptance Criteria

1. WHEN a player opens the game THEN the System SHALL display a settings panel with language, difficulty, and theme options
2. WHEN a player selects language mode THEN the System SHALL offer "Chinese Idioms" and "English Vocabulary" as options
3. WHEN a player selects difficulty level THEN the System SHALL offer "easy", "medium", and "hard" options with corresponding board sizes (4×4, 6×6, 8×8)
4. WHEN a player selects a theme THEN the System SHALL offer at least 4 theme categories (learning, virtue, growth, technology)
5. WHEN a player confirms settings THEN the System SHALL proceed to generate game content based on selections

### Requirement 2

**User Story:** As a player, I want to play a word matching game on a grid board, so that I can learn vocabulary through interactive gameplay.

#### Acceptance Criteria

1. WHEN a game starts THEN the System SHALL display a board with WordCards arranged in a grid matching the selected difficulty size
2. WHEN the board is generated THEN the System SHALL place matching pairs (word and meaning) randomly across the grid
3. WHEN a player clicks on a WordCard THEN the System SHALL highlight the selected card visually
4. WHEN a player selects two WordCards THEN the System SHALL evaluate whether they form a valid match
5. WHEN two cards are selected THEN the System SHALL check if a valid path exists between them with at most 2 turns

### Requirement 3

**User Story:** As a player, I want the game to validate my matches using path-finding rules, so that I experience authentic connect-game mechanics.

#### Acceptance Criteria

1. WHEN evaluating a path between two cards THEN the System SHALL use BFS algorithm to find valid connections
2. WHEN a direct line path exists between two cards THEN the System SHALL consider the path valid (0 turns)
3. WHEN a path with one turn exists between two cards THEN the System SHALL consider the path valid (1 turn)
4. WHEN a path with two turns exists between two cards THEN the System SHALL consider the path valid (2 turns)
5. WHEN no path with 2 or fewer turns exists THEN the System SHALL reject the connection attempt
6. WHEN a valid path is found THEN the System SHALL animate the connection line before removing the cards

### Requirement 4

**User Story:** As a player, I want immediate feedback on my matches, so that I can learn from both correct and incorrect attempts.

#### Acceptance Criteria

1. WHEN a correct match is made THEN the System SHALL remove both cards from the board and display a success indicator
2. WHEN an incorrect match is attempted THEN the System SHALL keep both cards on the board and display an error indicator
3. WHEN a match is evaluated THEN the System SHALL request AI explanation for the word pair
4. WHEN AI explanation is received THEN the System SHALL display the explanation in a non-intrusive tooltip or panel
5. WHEN a match attempt fails due to invalid path THEN the System SHALL indicate "no valid path" separately from content mismatch

### Requirement 5

**User Story:** As a player, I want AI-generated word content for each game, so that I get fresh learning material every session.

#### Acceptance Criteria

1. WHEN a game is initialized THEN the System SHALL request word pairs from the AI Service based on selected settings
2. WHEN AI Service generates content THEN the System SHALL receive word, meaning, hint, and optional confuse fields for each pair
3. WHEN AI Service is unavailable THEN the System SHALL fall back to a local word bank
4. WHEN content is generated THEN the System SHALL ensure the number of pairs matches half the board size (e.g., 8 pairs for 4×4)
5. WHEN generating Chinese idiom content THEN the System SHALL include cultural background in the hint field
6. WHEN generating English vocabulary content THEN the System SHALL include example sentences in the hint field

### Requirement 6

**User Story:** As a player, I want to see a learning summary after completing a game, so that I can review what I learned and identify areas for improvement.

#### Acceptance Criteria

1. WHEN all cards are cleared from the board THEN the System SHALL display a game completion screen
2. WHEN game ends THEN the System SHALL show statistics including correct matches, incorrect attempts, and time spent
3. WHEN game ends THEN the System SHALL request AI-generated learning summary based on game performance
4. WHEN AI summary is received THEN the System SHALL display personalized review suggestions
5. WHEN summary is displayed THEN the System SHALL offer options to replay or return to settings

### Requirement 7

**User Story:** As a player, I want the game difficulty to adapt to my performance, so that I stay challenged but not frustrated.

#### Acceptance Criteria

1. WHILE a player achieves 3 consecutive correct matches THEN the System SHALL increase visual complexity (reduce hint visibility)
2. WHILE a player makes 3 consecutive incorrect attempts THEN the System SHALL provide additional hints (highlight potential matches)
3. WHEN a player spends more than 30 seconds without action THEN the System SHALL offer a hint by briefly highlighting a valid pair
4. WHEN difficulty adjustments occur THEN the System SHALL apply changes smoothly without disrupting gameplay

### Requirement 8

**User Story:** As a developer, I want a clean API for AI content generation, so that the AI module can be easily maintained and replaced.

#### Acceptance Criteria

1. WHEN the backend receives a word generation request THEN the System SHALL accept language, level, and theme parameters
2. WHEN processing a generation request THEN the System SHALL construct appropriate prompts for the AI model
3. WHEN AI responds THEN the System SHALL parse and validate the JSON response structure
4. WHEN AI response is invalid THEN the System SHALL retry once before falling back to local content
5. WHEN returning word data THEN the System SHALL ensure consistent WordCard interface structure

### Requirement 9

**User Story:** As a player, I want the game to serialize and deserialize game state, so that I can resume games and my progress is preserved.

#### Acceptance Criteria

1. WHEN game state changes THEN the System SHALL serialize the current board state to JSON format
2. WHEN loading a saved game THEN the System SHALL deserialize JSON data back to valid game state
3. WHEN serializing game state THEN the System SHALL include board layout, remaining cards, score, and elapsed time
4. WHEN deserializing game state THEN the System SHALL validate data integrity before restoring
5. WHEN serialization round-trip occurs THEN the System SHALL preserve all game state properties exactly

