// Functions for updating the UI

function updateSearchResultsUI(word, definition, translation) {
    const resultsDiv = document.getElementById('search-results');
    if (resultsDiv) {
        // Sanitize inputs before inserting into HTML (basic example)
        const safeWord = word.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const safeDefinition = definition.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const safeTranslation = translation.replace(/</g, "&lt;").replace(/>/g, "&gt;");

        resultsDiv.innerHTML = `
            <h3>${safeWord}</h3>
            <p><strong>Definition:</strong> ${safeDefinition}</p>
            <p><strong>Traducción (Español):</strong> ${safeTranslation}</p>
        `;
        resultsDiv.style.color = 'black'; // Reset color in case of previous error
    }
}

function displayErrorUI(message) {
    const resultsDiv = document.getElementById('search-results');
    if (resultsDiv) {
        const safeMessage = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        resultsDiv.innerHTML = `<p style="color: red;">Error: ${safeMessage}</p>`;
    }
    // Or use a dedicated error display element
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
            button.textContent = optionText.replace(/</g, "&lt;").replace(/>/g, "&gt;"); // Basic sanitization
            button.className = 'quiz-option-button'; // For styling
            button.addEventListener('click', () => {
                answerCallback(optionText); // Pass the chosen definition text
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
            feedbackEl.innerHTML = '<p style="color: green;">Correct!</p>';
        } else {
            feedbackEl.innerHTML = `<p style="color: red;">Incorrect. The correct definition was: "${safeCorrectAnswer}"</p>`;
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
        }
    }
}

function displayQuizError(message) {
    const feedbackEl = document.getElementById('quiz-feedback'); // Reuse feedback area for errors
    const quizArea = document.getElementById('quiz-area');

    if (feedbackEl) {
        feedbackEl.innerHTML = `<p style="color: orange;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
    }
    if (quizArea && quizArea.style.display !== 'none') {
      // If quiz area is visible, maybe just show error and not hide it immediately
      // but ensure options are not clickable if it's a fatal error for current question
    } else if (quizArea) {
      // If quiz area is hidden, this error is likely before starting or for general issues
      showQuizArea(false); // Ensure it's hidden if error prevents start
      document.getElementById('start-practice-button').style.display = 'block';
    }
}

// --- Word List View UI Functions ---

function displayWordListUI(words) {
    const tbody = document.getElementById('word-list-tbody');
    if (!tbody) return;

    tbody.innerHTML = ''; // Clear previous list

    if (words.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">Your vocabulary is empty. Start by searching for words!</td></tr>';
        return;
    }

    words.forEach(wordData => {
        const row = tbody.insertRow();
        
        // Basic sanitization for each cell
        Object.values(wordData).forEach(text => {
            const cell = row.insertCell();
            // Ensure text is a string before trying to replace, numbers are fine as is.
            const cellText = (typeof text === 'string') ? text.replace(/</g, "&lt;").replace(/>/g, "&gt;") : text;
            cell.textContent = cellText;
        });
    });
}