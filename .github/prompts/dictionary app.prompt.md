# English-Spanish Vocabulary Learning Application

## Overview
I need to develop a lightweight vocabulary application that helps me learn English words by:
- Looking up definitions of unfamiliar English words
- Translating words to Spanish
- Storing words for later review
- Testing my knowledge through a quiz system

## Technical Requirements

### Backend
- **Extremely lightweight**: Designed for minimal resource usage
- **Low API traffic handling**: Optimized for personal use (<20 requests/month)
- **Deployment target**: Google Cloud Run or similar serverless platform
- **Database**: Simple storage solution for words, definitions, translations, and usage metrics

### Frontend
- **Pure HTML5/CSS/JS**: No heavy frameworks required
- **Responsive design**: Must work well on both desktop and mobile browsers
- **Minimalist UI**: Focus on functionality over aesthetics

## Core Functionality

### 1. Word Search
- **Input**: English word
- **Process**: 
    - Check local database first
    - If found: Increment view counter, return stored data
    - If not found: Call external APIs for definition and translation, store results
- **Output**: Word definition (English) and translation (Spanish)

### 2. Practice Mode
- **Input**: User request to practice
- **Process**:
    - Select a word from database using weighted random selection
        - Higher weight for less practiced/incorrectly answered words
    - Present word with 3 possible definitions (1 correct, 2 incorrect)
    - Track user's answer
        - Correct: Decrease word's weight in future selections
        - Incorrect: Increase word's weight for each wrong attempt
- **Output**: Quiz question, feedback on answer, updated word statistics

### 3. Word List View
- **Input**: User request to view vocabulary
- **Process**: Retrieve all stored words with metadata
- **Output**: Tabular display of words sorted by recency, showing:
    - English word
    - Definition
    - Spanish translation
    - View/search count
    - Practice statistics (optional)

## API Integration
- English dictionary API for definitions
- Translation API for English to Spanish conversion
- Both should offer free tiers sufficient for personal usage levels