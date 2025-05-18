// Functions for updating the UI

function updateSearchResultsUI(word, definition, translation) {
    const resultsDiv = document.getElementById('search-results');
    if (resultsDiv) {
        const safeWord = word.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const safeDefinition = definition.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const safeTranslation = translation.replace(/</g, "&lt;").replace(/>/g, "&gt;");

        resultsDiv.innerHTML = `
            <h3 class="text-xl font-semibold text-app-accent mb-2">${safeWord}</h3>
            <p class="mb-1"><strong class="font-medium text-app-text-primary">Definition:</strong> ${safeDefinition}</p>
            <p><strong class="font-medium text-app-text-primary">Traducción (Español):</strong> ${safeTranslation}</p>
        `;
    }
}

function displayErrorUI(message, area = 'search') {
    let errorDisplayElement;
    if (area === 'search') {
        errorDisplayElement = document.getElementById('search-results');
    } else if (area === 'quiz') {
        errorDisplayElement = document.getElementById('quiz-feedback');
    } else if (area === 'list') {
        console.error("Error in word list: ", message);
        alert("Error displaying word list: " + message.replace(/</g, "&lt;").replace(/>/g, "&gt;"));
        return;
    }

    if (errorDisplayElement) {
        const safeMessage = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        errorDisplayElement.innerHTML = `<p class="text-app-red font-medium p-3 bg-red-900 bg-opacity-30 rounded-md">Error: ${safeMessage}</p>`;
    }
}

// --- Practice Mode UI Functions ---

function showQuizArea(show) {
    const quizArea = document.getElementById('quiz-area');
    if (quizArea) {
        quizArea.style.display = show ? 'block' : 'none';
    }
}

function displayPracticeQuestionUI(word, options, answerCallback) {
    const quizWordEl = document.getElementById('quiz-word');
    const quizOptionsEl = document.getElementById('quiz-options');
    
    if (quizWordEl) quizWordEl.textContent = word;
    
    if (quizOptionsEl) {
        quizOptionsEl.innerHTML = ''; // Clear previous options
        options.forEach(optionText => {
            const button = document.createElement('button');
            button.textContent = optionText.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            button.className = 'quiz-option-button block w-full text-left p-3 mb-2 bg-app-surface hover:bg-app-accent hover:text-white rounded-lg transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-app-accent text-app-text-primary';
            button.addEventListener('click', () => {
                Array.from(quizOptionsEl.children).forEach(btn => {
                    btn.classList.remove('bg-app-accent', 'text-white');
                    btn.classList.add('bg-app-surface', 'text-app-text-primary');
                    btn.disabled = true;
                });
                button.classList.remove('bg-app-surface', 'text-app-text-primary');
                button.classList.add('bg-app-accent', 'text-white');
                answerCallback(optionText);
            });
            quizOptionsEl.appendChild(button);
        });
    }
}

function displayQuizFeedback(isCorrect, correctAnswerText) {
    const feedbackEl = document.getElementById('quiz-feedback');
    if (feedbackEl) {
        const safeCorrectAnswer = correctAnswerText.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        if (isCorrect) {
            feedbackEl.innerHTML = '<p class="text-app-green font-semibold p-3 bg-green-900 bg-opacity-30 rounded-md">Correct!</p>';
        } else {
            feedbackEl.innerHTML = `<p class="text-app-red font-semibold p-3 bg-red-900 bg-opacity-30 rounded-md">Incorrect. The correct definition was: "${safeCorrectAnswer}"</p>`;
        }
    }
}

function clearQuizFeedback() {
    const feedbackEl = document.getElementById('quiz-feedback');
    if (feedbackEl) feedbackEl.innerHTML = '';
}

function showNextQuestionButton(show) {
    const button = document.getElementById('next-question-button');
    if (button) {
        button.style.display = show ? 'inline-block' : 'none';
    }
}

function disableQuizOptions() {
    const quizOptionsEl = document.getElementById('quiz-options');
    if (quizOptionsEl) {
        const buttons = quizOptionsEl.getElementsByTagName('button');
        for (let button of buttons) {
            button.disabled = true;
            button.classList.add('opacity-75', 'cursor-not-allowed');
        }
    }
}

function displayQuizError(message) {
    const feedbackEl = document.getElementById('quiz-feedback');
    const quizArea = document.getElementById('quiz-area');

    if (feedbackEl) {
        feedbackEl.innerHTML = `<p class="text-orange-500 font-semibold p-3 bg-orange-900 bg-opacity-30 rounded-md">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
    }
    if (quizArea && quizArea.style.display !== 'none') {
    } else if (quizArea) {
        showQuizArea(false);
        const startButton = document.getElementById('start-practice-button');
        if (startButton) startButton.style.display = 'block';
    }
}

// --- Word List View UI Functions ---

function displayWordListUI(words) {
    const tbody = document.getElementById('word-list-tbody');
    const container = document.getElementById('word-list-table-container');
    if (!tbody || !container) return;

    tbody.innerHTML = ''; // Clear previous list

    if (words.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-app-text-secondary">Your vocabulary is empty. Start by searching for words!</td></tr>';
        return;
    }

    words.forEach(wordData => {
        const row = tbody.insertRow();
        row.className = 'hover:bg-gray-800 transition duration-150 ease-in-out';

        const cellsData = [
            wordData.word || wordData.englishWord,
            wordData.definition,
            wordData.translation,
            wordData.viewCount || wordData.views || 0,
            wordData.correctAnswers || 0,
            wordData.incorrectAnswers || 0,
            wordData.practiceWeight || 0
        ];

        cellsData.forEach(text => {
            const cell = row.insertCell();
            cell.className = 'py-3 px-4 text-sm text-app-text-primary';
            const cellText = (typeof text === 'string') ? text.replace(/</g, "&lt;").replace(/>/g, "&gt;") : (text !== undefined && text !== null ? text : '-');
            cell.textContent = cellText;
        });
    });
}

// --- Tab Navigation ---
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => {
                btn.classList.remove('active-tab', 'text-app-accent', 'border-app-accent');
                btn.classList.add('text-app-text-secondary', 'hover:text-app-accent');
            });
            tabContents.forEach(content => {
                content.style.display = 'none';
            });

            button.classList.add('active-tab', 'text-app-accent', 'border-app-accent');
            button.classList.remove('text-app-text-secondary', 'hover:text-app-accent');
            const targetTab = button.getAttribute('data-tab');
            const activeContent = document.getElementById(targetTab);
            if (activeContent) {
                activeContent.style.display = 'block';
            }

            if (targetTab === 'word-list-content') {
                if (typeof renderWordList === 'function') {
                    renderWordList(); // Call renderWordList from app.js
                }
            }
        });
    });

    let initialTabActivated = false;
    const initialActiveButton = document.querySelector('.tab-button.active-tab');
    if (initialActiveButton) {
        const initialTabContentId = initialActiveButton.getAttribute('data-tab');
        const initialActiveContent = document.getElementById(initialTabContentId);
        if (initialActiveContent) {
            initialActiveContent.style.display = 'block';
            if (initialTabContentId === 'word-list-content') {
                if (typeof renderWordList === 'function') {
                    renderWordList(); // Call renderWordList from app.js
                    initialTabActivated = true;
                }
            }
        }
    }
    
    // If no tab was explicitly set as active in HTML, or if the active one wasn't the word list,
    // and the first tab is the word list, trigger its loading.
    if (!initialTabActivated && tabButtons.length > 0) {
        if (!document.querySelector('.tab-button.active-tab')) {
             tabButtons[0].click(); 
        } else if (initialActiveButton && initialActiveButton.getAttribute('data-tab') !== 'word-list-content' && tabButtons[0].getAttribute('data-tab') === 'word-list-content' && initialActiveButton !== tabButtons[0]){
        } else if (initialActiveButton && initialActiveButton.getAttribute('data-tab') === 'word-list-content' && !initialTabActivated) {
             if (typeof renderWordList === 'function') {
                renderWordList();
            }
        }
    }
}