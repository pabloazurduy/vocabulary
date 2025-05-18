// Functions for interacting with external APIs (Dictionary and Translation)

// Mock Dictionary API (simulates DictionaryAPI.dev)
async function fetchDefinition(word) {
    console.log(`Mock API: Fetching definition for ${word}...`);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Sample definitions
    const mockDefinitions = {
        "apple": "A round fruit with firm, white flesh and a green or red skin.",
        "book": "A set of written or printed sheets of paper bound together.",
        "cat": "A small domesticated carnivorous mammal with soft fur, a short snout, and retractable claws.",
        "dog": "A domesticated carnivorous mammal that typically has a long snout, an acute sense of smell, and a barking, howling, or whining voice."
    };

    if (mockDefinitions[word.toLowerCase()]) {
        return mockDefinitions[word.toLowerCase()];
    } else {
        // Simulate a "not found" scenario or a generic definition
        // In a real API, this might be a 404 or a specific message
        // For now, let's return a placeholder if not in our small mock set
        // throw new Error(`Definition for "${word}" not found in mock API.`);
        return `A definition for "${word}" (mocked).`; 
    }
}

// Mock Translation API (simulates MyMemory or similar)
async function fetchTranslation(word, targetLang = 'es') {
    console.log(`Mock API: Fetching translation for ${word} to ${targetLang}...`);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Sample translations
    const mockTranslations = {
        "apple": "Manzana",
        "book": "Libro",
        "cat": "Gato",
        "dog": "Perro"
    };
    
    if (targetLang === 'es' && mockTranslations[word.toLowerCase()]) {
        return mockTranslations[word.toLowerCase()];
    } else {
        // Simulate a "not found" or generic translation
        // throw new Error(`Translation for "${word}" to ${targetLang} not found in mock API.`);
        return `Una traducción para "${word}" a ${targetLang} (simulada).`;
    }
}