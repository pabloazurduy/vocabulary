// Base URL for your backend API - Using relative path for seamless deployment
const BASE_URL = '/api'; // Changed from absolute URL to relative path

async function searchWord(word) {
    try {
        const response = await fetch(`${BASE_URL}/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ word: word }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error searching word:", error);
        throw error;
    }
}

async function getWordList() {
    try {
        const response = await fetch(`${BASE_URL}/words`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error getting word list:", error);
        throw error;
    }
}

async function getPracticeQuestion() {
    try {
        const response = await fetch(`${BASE_URL}/practice`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error getting practice question:", error);
        throw error;
    }
}

async function submitPracticeAnswer(word, is_correct) {
    try {
        const response = await fetch(`${BASE_URL}/answer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ word: word, is_correct: is_correct }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error submitting answer:", error);
        throw error;
    }
}

async function deleteWord(word) {
    try {
        const response = await fetch(`${BASE_URL}/words/${encodeURIComponent(word)}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        // Refresh the word list after successful deletion
        const words = await getWordList();
        displayWordList(words);
    } catch (error) {
        console.error("Error deleting word:", error);
        throw error;
    }
}