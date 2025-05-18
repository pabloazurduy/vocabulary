// Main application logic for Vocabulary Learner

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
document.getElementById('search-button').addEventListener('click', async () => {
    const word = document.getElementById('search-input').value.trim();
    if (word) {
        try {
            const data = await searchWord(word);
            displaySearchResults(data);
        } catch (error) {
            document.getElementById('results').innerHTML = `
                <div class="text-app-red">
                    Error: ${error.message}
                </div>`;
        }
    }
});

document.getElementById('search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('search-button').click();
    }
});

// Navigation event listeners
document.getElementById('view-search').addEventListener('click', () => showView('search-view'));
document.getElementById('view-list').addEventListener('click', async () => {
    showView('list-view');
    try {
        const words = await getWordList();
        displayWordList(words);
    } catch (error) {
        document.getElementById('word-list-tbody').innerHTML = `
            <tr><td colspan="6" class="px-6 py-4 text-center text-app-red">
                Error loading word list: ${error.message}
            </td></tr>`;
    }
});
document.getElementById('view-practice').addEventListener('click', () => {
    showView('practice-view');
    loadPracticeQuestion();
});

// --- UI Update Functions ---
function showView(viewId) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.add('hidden');
    });
    // Show requested view
    document.getElementById(viewId).classList.remove('hidden');

    // Update active state in navigation
    document.querySelectorAll('nav button').forEach(btn => {
        btn.classList.remove('bg-app-surface-lighter');
    });
    document.querySelector(`button[id="view-${viewId.split('-')[0]}"]`)
        ?.classList.add('bg-app-surface-lighter');
}

function displaySearchResults(data) {
    const resultsDiv = document.getElementById('results');
    if (!data) {
        resultsDiv.innerHTML = '<p class="text-app-text-secondary">No data found.</p>';
        return;
    }

    resultsDiv.innerHTML = `
        <div class="space-y-4">
            <div class="flex items-start justify-between">
                <h3 class="text-xl font-medium text-app-accent">${data.english_word}</h3>
                <span class="text-sm text-app-text-secondary">Views: ${data.view_count || 0}</span>
            </div>
            <div class="space-y-3">
                <div>
                    <h4 class="text-sm uppercase text-app-text-secondary mb-1">Definition</h4>
                    <p class="text-app-text-primary">${data.definition}</p>
                </div>
                <div>
                    <h4 class="text-sm uppercase text-app-text-secondary mb-1">Spanish Translation</h4>
                    <p class="text-app-text-primary">${data.translation}</p>
                </div>
            </div>
        </div>
    `;
}

function displayWordList(words) {
    const tbody = document.getElementById('word-list-tbody');
    tbody.innerHTML = ''; // Clear existing content

    if (!words || words.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-app-text-secondary">
                    No words saved yet.
                </td>
            </tr>`;
        return;
    }

    words.forEach(word => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-app-surface-lighter transition-colors';
        tr.innerHTML = `
            <td class="px-6 py-4">
                <span class="font-medium text-app-accent">${word.english_word}</span>
            </td>
            <td class="px-6 py-4">
                <p class="text-sm text-app-text-primary line-clamp-2">${word.definition}</p>
            </td>
            <td class="px-6 py-4">
                <p class="text-sm text-app-text-primary">${word.translation}</p>
            </td>
            <td class="px-6 py-4">
                <span class="text-app-text-secondary">${word.view_count || 0}</span>
            </td>
            <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                    <span class="text-app-green">${word.practice_correct_count || 0}</span>
                    <span class="text-app-text-secondary">/</span>
                    <span class="text-app-red">${word.practice_incorrect_count || 0}</span>
                </div>
            </td>
            <td class="px-6 py-4">
                <button onclick="deleteWord('${word.english_word}')" 
                    class="text-app-red hover:text-red-400 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
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
    const wordDisplay = document.getElementById('word-display');
    const optionsContainer = document.getElementById('options-container');
    const feedback = document.getElementById('feedback');

    wordDisplay.innerHTML = `
        <h3 class="text-xl font-medium mb-2">What is the definition of:</h3>
        <p class="text-2xl font-bold text-app-accent mb-6">${question.english_word}</p>
    `;

    optionsContainer.innerHTML = '';
    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'w-full text-left bg-app-surface-lighter hover:bg-opacity-80 p-4 rounded-lg transition-colors text-app-text-primary';
        button.textContent = option;
        button.onclick = () => handlePracticeAnswer(option);
        optionsContainer.appendChild(button);
    });

    feedback.innerHTML = ''; // Clear any previous feedback
}

async function handlePracticeAnswer(selectedOption) {
    const feedbackP = document.getElementById('practice-feedback');
    if (!currentPracticeQuestion) return;

    const isCorrect = selectedOption === currentPracticeQuestion.correct_definition;
    try {
        await submitPracticeAnswer(currentPracticeQuestion.english_word, isCorrect);
        showPracticeFeedback(isCorrect, currentPracticeQuestion.correct_definition);
    } catch (error) {
        feedbackP.textContent = `Error submitting answer: ${error.message}`;
        feedbackP.className = 'error';
    }
}

function showPracticeFeedback(isCorrect, correctDefinition) {
    const feedback = document.getElementById('feedback');
    const optionsContainer = document.getElementById('options-container');
    
    // Disable all option buttons
    optionsContainer.querySelectorAll('button').forEach(btn => {
        btn.disabled = true;
        btn.className = btn.textContent === correctDefinition
            ? 'w-full text-left bg-app-green bg-opacity-20 p-4 rounded-lg text-app-text-primary cursor-not-allowed'
            : 'w-full text-left bg-app-surface-lighter opacity-50 p-4 rounded-lg text-app-text-primary cursor-not-allowed';
    });

    feedback.innerHTML = isCorrect
        ? `<div class="text-app-green font-medium">Correct!</div>`
        : `<div class="space-y-2">
            <div class="text-app-red font-medium">Incorrect</div>
            <div class="text-app-text-secondary">The correct definition was:</div>
            <div class="text-app-text-primary">${correctDefinition}</div>
        </div>`;

    // Add "Next Question" button
    const nextButton = document.createElement('button');
    nextButton.className = 'mt-6 bg-app-accent hover:bg-app-accent-hover text-white px-6 py-2 rounded-lg transition-colors';
    nextButton.textContent = 'Next Question';
    nextButton.onclick = loadPracticeQuestion;
    feedback.appendChild(nextButton);
}

// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    showView('search-view');
});