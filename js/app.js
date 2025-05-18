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

const searchButton = document.getElementById('search-button');
const searchInput = document.getElementById('search-input');
const resultsDiv = document.getElementById('results');
const wordListDiv = document.getElementById('word-list');
const practiceModeDiv = document.getElementById('practice-mode');

const viewSearchButton = document.getElementById('view-search');
const viewListButton = document.getElementById('view-list');
const viewPracticeButton = document.getElementById('view-practice');

// --- App State ---
let currentPracticeQuestion = null;

// --- Event Listeners ---
searchButton.addEventListener('click', async () => {
    const word = searchInput.value.trim();
    if (word) {
        try {
            const data = await searchWord(word);
            displaySearchResults(data);
        } catch (error) {
            resultsDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        }
    }
});

viewSearchButton.addEventListener('click', () => showView('search-view'));
viewListButton.addEventListener('click', async () => {
    showView('list-view');
    await loadAndDisplayWordList();
});
viewPracticeButton.addEventListener('click', async () => {
    showView('practice-view');
    await loadPracticeQuestion();
});

// --- UI Update Functions ---
function showView(viewId) {
    document.querySelectorAll('.view').forEach(view => {
        view.style.display = 'none';
    });
    document.getElementById(viewId).style.display = 'block';
    // Clear previous results/content when switching views
    if (viewId === 'search-view') {
        resultsDiv.innerHTML = '';
        searchInput.value = '';
    }
    // Add similar clearing for other views if needed
}

function displaySearchResults(data) {
    if (!data) {
        resultsDiv.innerHTML = '<p>No data found.</p>';
        return;
    }
    resultsDiv.innerHTML = `
        <h3>${data.english_word}</h3>
        <p><strong>Definition:</strong> ${data.definition}</p>
        <p><strong>Traducción:</strong> ${data.translation}</p>
        <p><small>View Count: ${data.view_count}</small></p>
    `;
}

async function loadAndDisplayWordList() {
    try {
        const words = await getWordList();
        wordListDiv.innerHTML = ''; // Clear previous list
        if (!words || words.length === 0) {
            wordListDiv.innerHTML = '<p>No words saved yet.</p>';
            return;
        }

        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Word</th>
                    <th>Definition</th>
                    <th>Translation</th>
                    <th>View Count</th>
                    <th>Correct</th>
                    <th>Incorrect</th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        `;
        const tbody = table.querySelector('tbody');
        words.forEach(word => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${word.english_word}</td>
                <td>${word.definition}</td>
                <td>${word.translation}</td>
                <td>${word.view_count || 0}</td>
                <td>${word.practice_correct_count || 0}</td>
                <td>${word.practice_incorrect_count || 0}</td>
            `;
            tbody.appendChild(tr);
        });
        wordListDiv.appendChild(table);
    } catch (error) {
        wordListDiv.innerHTML = `<p class="error">Error loading word list: ${error.message}</p>`;
    }
}

async function loadPracticeQuestion() {
    try {
        currentPracticeQuestion = await getPracticeQuestion();
        if (!currentPracticeQuestion) {
            practiceModeDiv.innerHTML = '<p>No questions available.</p>';
            return;
        }
        displayPracticeQuestion(currentPracticeQuestion);
    } catch (error) {
        practiceModeDiv.innerHTML = `<p class="error">Error loading practice question: ${error.message}</p>`;
    }
}

function displayPracticeQuestion(question) {
    practiceModeDiv.innerHTML = ''; // Clear previous question
    const questionP = document.createElement('p');
    questionP.textContent = `What is the definition of: "${question.english_word}"?`;
    practiceModeDiv.appendChild(questionP);

    const optionsDiv = document.createElement('div');
    optionsDiv.classList.add('options');
    question.options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option;
        button.addEventListener('click', () => handlePracticeAnswer(option));
        optionsDiv.appendChild(button);
    });
    practiceModeDiv.appendChild(optionsDiv);

    const feedbackP = document.createElement('p');
    feedbackP.id = 'practice-feedback';
    practiceModeDiv.appendChild(feedbackP);
}

async function handlePracticeAnswer(selectedOption) {
    const feedbackP = document.getElementById('practice-feedback');
    if (!currentPracticeQuestion) return;

    const isCorrect = selectedOption === currentPracticeQuestion.correct_definition;
    try {
        await submitPracticeAnswer(currentPracticeQuestion.english_word, isCorrect);
        if (isCorrect) {
            feedbackP.textContent = 'Correct!';
            feedbackP.className = 'feedback-correct';
        } else {
            feedbackP.textContent = `Incorrect. The correct answer was: ${currentPracticeQuestion.correct_definition}`;
            feedbackP.className = 'feedback-incorrect';
        }
        // Disable option buttons after answer
        practiceModeDiv.querySelectorAll('.options button').forEach(btn => btn.disabled = true);
        
        // Add a "Next Question" button
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next Question';
        nextButton.id = 'next-question-button'; // Added id for styling/selection
        nextButton.addEventListener('click', loadPracticeQuestion);
        practiceModeDiv.appendChild(nextButton);

    } catch (error) {
        feedbackP.textContent = `Error submitting answer: ${error.message}`;
        feedbackP.className = 'error';
    }
}

// --- Initial Setup ---
function init() {
    // Show search view by default
    showView('search-view');
    // Any other initializations
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);