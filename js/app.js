// Main application logic for Vocabulary Learner

// Mock local database
let localWordsDB = {
    "hello": {
        definition: "A greeting.",
        translation: "Hola",
        viewCount: 3,
        practiceStats: { correct: 0, incorrect: 0, weight: 10 }
    },
    "world": {
        definition: "The earth, together with all of its countries and peoples.",
        translation: "Mundo",
        viewCount: 2,
        practiceStats: { correct: 0, incorrect: 0, weight: 10 }
    },
    "developer": {
        definition: "A person that develops something, typically software.",
        translation: "Desarrollador/a",
        viewCount: 1,
        practiceStats: { correct: 0, incorrect: 0, weight: 10 }
    }
};

let currentQuizWordKey = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Vocabulary App Initialized');

    const searchButton = document.getElementById('search-button');
    const searchInput = document.getElementById('search-input');
    
    if (searchButton && searchInput) {
        searchButton.addEventListener('click', async () => {
            const word = searchInput.value.trim().toLowerCase();
            if (word) {
                console.log(`Searching for word: ${word}`);
                if (localWordsDB[word]) {
                    // Word found in local DB
                    localWordsDB[word].viewCount++;
                    console.log(`Word "${word}" found in local DB. View count: ${localWordsDB[word].viewCount}`);
                    updateSearchResultsUI(word, localWordsDB[word].definition, localWordsDB[word].translation);
                } else {
                    // Word not found, call "external" APIs
                    console.log(`Word "${word}" not in local DB. Fetching from API...`);
                    try {
                        const definition = await fetchDefinition(word); // from api.js
                        const translation = await fetchTranslation(word, 'es'); // from api.js
                        
                        // Store in local DB
                        localWordsDB[word] = {
                            definition: definition,
                            translation: translation,
                            viewCount: 1,
                            practiceStats: { correct: 0, incorrect: 0, weight: 10 } // Default weight
                        };
                        console.log(`Word "${word}" fetched and stored. Definition: ${definition}, Translation: ${translation}`);
                        updateSearchResultsUI(word, definition, translation);
                    } catch (error) {
                        console.error('Error during word search:', error);
                        displayErrorUI(error.message || 'Failed to search for word.');
                    }
                }
                searchInput.value = ''; // Clear input after search
            } else {
                displayErrorUI('Please enter a word.');
            }
        });
    }

    initPracticeMode(); // Initialize Practice Mode
    initWordListView(); // Initialize Word List View
});

function initPracticeMode() {
    const startPracticeButton = document.getElementById('start-practice-button');
    const nextQuestionButton = document.getElementById('next-question-button');

    if (startPracticeButton) {
        startPracticeButton.addEventListener('click', () => {
            if (Object.keys(localWordsDB).length < 3) {
                displayQuizError("Need at least 3 words in your vocabulary to start practice mode.");
                return;
            }
            showQuizArea(true);
            startNewQuizQuestion();
            startPracticeButton.style.display = 'none'; // Hide start button once quiz begins
        });
    }

    if (nextQuestionButton) {
        nextQuestionButton.addEventListener('click', () => {
            startNewQuizQuestion();
        });
    }
}

function startNewQuizQuestion() {
    clearQuizFeedback();
    showNextQuestionButton(false);

    currentQuizWordKey = selectWordForPractice();

    if (!currentQuizWordKey) {
        displayQuizError("No words available for practice or all words mastered (weights too low). Add or review words!");
        showQuizArea(false); 
        document.getElementById('start-practice-button').style.display = 'block'; // Show start button again
        return;
    }

    const wordData = localWordsDB[currentQuizWordKey];
    const options = generateQuizOptions(currentQuizWordKey);

    if (!options) {
         displayQuizError("Could not generate quiz options. Need at least 3 distinct words with definitions.");
         showQuizArea(false);
         document.getElementById('start-practice-button').style.display = 'block';
         return;
    }
    displayPracticeQuestionUI(currentQuizWordKey, options, handleAnswerChoice);
}

function selectWordForPractice() {
    const words = Object.keys(localWordsDB);
    if (words.length === 0) return null;

    let weightedWords = [];
    let totalWeight = 0;

    words.forEach(wordKey => {
        const weight = localWordsDB[wordKey].practiceStats.weight || 1; // Default weight 1 if undefined
        weightedWords.push({ key: wordKey, weight: weight });
        totalWeight += weight;
    });
    
    if (totalWeight === 0) return null; // All words might have 0 weight if mastered

    let random = Math.random() * totalWeight;

    for (let i = 0; i < weightedWords.length; i++) {
        if (random < weightedWords[i].weight) {
            return weightedWords[i].key;
        }
        random -= weightedWords[i].weight;
    }
    return weightedWords[weightedWords.length - 1].key; // Fallback, should ideally not be reached if logic is correct
}

function generateQuizOptions(correctWordKey) {
    const correctDefinition = localWordsDB[correctWordKey].definition;
    let options = [correctDefinition];
    
    const allWordKeys = Object.keys(localWordsDB);
    let otherWordKeys = allWordKeys.filter(key => key !== correctWordKey && localWordsDB[key].definition !== correctDefinition);

    if (otherWordKeys.length < 2) {
        // Not enough unique other words to pick two distinct incorrect definitions
        console.warn("Not enough distinct words for 2 incorrect options. Practice mode might be less effective.");
        // Fallback: try to use any other definitions, even if it means fewer than 2 unique incorrect ones, or duplicates if DB is very small.
        // This part can be improved with placeholder incorrect definitions if needed.
        // For now, we'll try to pick what we can.
        while(options.length < 3 && otherWordKeys.length > 0) {
            const randomIdx = Math.floor(Math.random() * otherWordKeys.length);
            const incorrectDef = localWordsDB[otherWordKeys[randomIdx]].definition;
            if (!options.includes(incorrectDef)) { // Ensure definition is not already an option
                 options.push(incorrectDef);
            }
            otherWordKeys.splice(randomIdx, 1); // Remove to avoid re-picking
        }
        // If still not 3 options, this indicates a very small DB.
        // The initial check for Object.keys(localWordsDB).length < 3 should prevent most severe cases.
        if (options.length < 3) {
            // Add generic incorrect options if we couldn't find enough
            const genericIncorrect = ["Not the right definition.", "An unrelated concept."];
            let i = 0;
            while(options.length < 3 && i < genericIncorrect.length) {
                if (!options.includes(genericIncorrect[i])) {
                    options.push(genericIncorrect[i]);
                }
                i++;
            }
        }
         // If still not 3, it's a tough spot. The UI expects 3.
        while(options.length < 3) options.push("Placeholder incorrect option");


    } else {
        // Shuffle and pick two distinct incorrect definitions
        for (let i = otherWordKeys.length - 1; i > 0; i--) { // Shuffle otherWordKeys
            const j = Math.floor(Math.random() * (i + 1));
            [otherWordKeys[i], otherWordKeys[j]] = [otherWordKeys[j], otherWordKeys[i]];
        }
        options.push(localWordsDB[otherWordKeys[0]].definition);
        // Ensure the second incorrect option is different from the first, if possible
        if (otherWordKeys.length > 1 && localWordsDB[otherWordKeys[1]].definition !== localWordsDB[otherWordKeys[0]].definition && localWordsDB[otherWordKeys[1]].definition !== correctDefinition) {
            options.push(localWordsDB[otherWordKeys[1]].definition);
        } else { // Find another one or use a placeholder
            let foundSecond = false;
            for(let k=2; k < otherWordKeys.length; k++) {
                if (localWordsDB[otherWordKeys[k]].definition !== localWordsDB[otherWordKeys[0]].definition && localWordsDB[otherWordKeys[k]].definition !== correctDefinition) {
                     options.push(localWordsDB[otherWordKeys[k]].definition);
                     foundSecond = true;
                     break;
                }
            }
            if (!foundSecond) options.push("Another incorrect definition."); // Fallback
        }
         // Ensure we have exactly 3 options, even if fallbacks were used.
        while(options.length > 3) options.pop();
        while(options.length < 3) options.push("Placeholder option.");
    }

    // Shuffle the final options array
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }
    return options;
}

function handleAnswerChoice(chosenDefinitionText) {
    if (!currentQuizWordKey) return;

    const wordStats = localWordsDB[currentQuizWordKey].practiceStats;
    const correctDefinition = localWordsDB[currentQuizWordKey].definition;
    const isCorrect = (chosenDefinitionText === correctDefinition);

    if (isCorrect) {
        wordStats.correct++;
        wordStats.weight = Math.max(1, Math.floor(wordStats.weight / 2)); // Decrease weight, min 1
        displayQuizFeedback(true, correctDefinition);
    } else {
        wordStats.incorrect++;
        wordStats.weight = Math.min(100, Math.floor(wordStats.weight * 1.5)); // Increase weight, max 100 (to prevent runaway weights)
        displayQuizFeedback(false, correctDefinition);
    }
    console.log(`Updated stats for "${currentQuizWordKey}":`, wordStats);
    showNextQuestionButton(true);
    disableQuizOptions(); // Prevent changing answer after submission
}

function initWordListView() {
    const toggleButton = document.getElementById('toggle-word-list-button');
    const wordListContainer = document.getElementById('word-list-table-container');

    if (toggleButton && wordListContainer) {
        toggleButton.addEventListener('click', () => {
            const isHidden = wordListContainer.style.display === 'none';
            if (isHidden) {
                renderWordList();
                wordListContainer.style.display = 'block';
                toggleButton.textContent = 'Hide Vocabulary';
            } else {
                wordListContainer.style.display = 'none';
                toggleButton.textContent = 'Show Vocabulary';
            }
        });
    }
}

function getAllWordsForDisplay() {
    return Object.entries(localWordsDB).map(([word, data]) => ({
        englishWord: word,
        definition: data.definition,
        translation: data.translation,
        viewCount: data.viewCount,
        correctAnswers: data.practiceStats.correct,
        incorrectAnswers: data.practiceStats.incorrect,
        practiceWeight: data.practiceStats.weight,
        // Add a timestamp or recency score if you want to sort by recency
        // For now, will be sorted alphabetically or by insertion order (depending on JS engine for Object.entries)
        // To sort by recency, you'd need to store a timestamp when words are added/updated.
    })).sort((a, b) => a.englishWord.localeCompare(b.englishWord)); // Sort alphabetically for now
}

function renderWordList() {
    const words = getAllWordsForDisplay();
    displayWordListUI(words);
}