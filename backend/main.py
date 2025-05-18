import os
import requests  # For DictionaryAPI (potentially remove if fully replaced)
from flask import Flask, request, jsonify
from flask_cors import CORS
from google.cloud import firestore
import google.generativeai as genai  # Added for Gemini
import random

# Initialize Flask App
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize Firestore Client
try:
    db = firestore.Client(database='vocabulary')
except Exception as e:
    print(f"Error initializing Firestore: {e}")
    db = None

# Initialize Google Gemini Client
try:
    gemini_api_key = os.environ.get('GEMINI_API_KEY')
    if not gemini_api_key:
        raise ValueError("GEMINI_API_KEY environment variable not set.")
    genai.configure(api_key=gemini_api_key)
    gemini_model = genai.GenerativeModel('gemma-3-12b-it')  # Changed to gemini-pro
except ValueError as ve:
    print(f"Configuration error for Gemini: {ve}")
    gemini_model = None
except Exception as e:
    print(f"Error initializing Google Gemini client: {e}")
    gemini_model = None

# --- External API Functions (Now using Gemini) ---
def get_definition_with_gemini(word):
    """Fetches definition from Gemini API."""
    if not word or not gemini_model:
        if not gemini_model:
            print("Gemini model not initialized.")
            return "Definition service not available (Gemini not initialized)."
        return None
    try:
        prompt = f"What is the definition of the English word '{word}'? Provide a concise definition suitable for a vocabulary learning app."
        response = gemini_model.generate_content(prompt)
        if response.parts:
            definition = response.text
            if "definition of" in definition.lower() or word.lower() in definition.lower() or "means" in definition.lower():
                if "definition of" in definition and ":" in definition:
                    definition = definition.split(":", 1)[1].strip()
                return definition
            else:
                print(f"Gemini did not provide a clear definition for '{word}'. Response: {definition}")
                return f"Could not retrieve a clear definition for '{word}' from the AI."
        else:
            print(f"Gemini API: No parts in response for definition of '{word}'. Full response: {response}")
            return "No definition found (empty response from AI)."
    except Exception as e:
        print(f"Gemini API: Error getting definition for '{word}': {e}")
        return "Error during definition lookup with AI."

def translate_to_spanish_with_gemini(text):
    """Translates text to Spanish using Gemini API."""
    if not text or not gemini_model:
        if not gemini_model:
            print("Gemini model not initialized.")
            return "Translation service not available (Gemini not initialized)."
        return None
    try:
        prompt = f"Translate the following English text to Spanish: '{text}'"
        response = gemini_model.generate_content(prompt)
        if response.parts:
            translation = response.text
            if text.lower() not in translation.lower() or len(translation) < len(text) * 0.5:
                return translation
            else:
                print(f"Gemini might not have translated '{text}'. Response: {translation}")
                return f"Could not reliably translate '{text}' with the AI."
        else:
            print(f"Gemini API: No parts in response for translation of '{text}'. Full response: {response}")
            return "No translation found (empty response from AI)."
    except Exception as e:
        print(f"Gemini API: Error translating '{text}': {e}")
        return "Error during translation with AI."

# --- API Endpoints ---

@app.route("/api/search", methods=['POST'])
def search_word():
    if not db:
        return jsonify({"error": "Firestore not initialized"}), 500
    if not gemini_model:
        return jsonify({"error": "AI service (Gemini) not initialized"}), 500
        
    try:
        data = request.get_json()
        english_word = data.get('word', '').strip()

        if not english_word:
            return jsonify({"error": "Word not provided"}), 400

        word_ref = db.collection('words').document(english_word.lower())
        doc = word_ref.get()

        if doc.exists:  # Changed from doc.exists() to doc.exists
            word_data = doc.to_dict()
            word_ref.update({"view_count": firestore.Increment(1)})
            word_data['view_count'] = word_data.get('view_count', 0) + 1
            return jsonify(word_data), 200
        else:
            definition = get_definition_with_gemini(english_word)
            translation = None
            
            if definition and not definition.startswith("Error") and not definition.startswith("Definition service not available") and not definition.startswith("Could not retrieve") and not definition.startswith("No definition found"):
                translation = translate_to_spanish_with_gemini(english_word)
            else:
                translation = "Translation not available due to definition error."
                if not definition:
                    definition = "Definition not found or AI service error."
            
            if not translation or translation.startswith("Error") or translation.startswith("Translation service") or translation.startswith("Could not reliably translate"):
                if not translation:
                    translation = "Translation failed or AI service error."

            new_word_data = {
                "english_word": english_word,
                "definition": definition,
                "translation": translation,
                "view_count": 1,
                "practice_correct_count": 0,
                "practice_incorrect_count": 0,
                "created_at": firestore.SERVER_TIMESTAMP
            }
            word_ref.set(new_word_data)
            return jsonify(new_word_data), 201
    except Exception as e:
        print(f"Error in /api/search: {e}")
        return jsonify({"error": "An internal error occurred"}), 500

@app.route("/api/words", methods=['GET'])
def get_words():
    if not db:
        return jsonify({"error": "Firestore not initialized"}), 500
    try:
        words_ref = db.collection('words').order_by('created_at', direction=firestore.Query.DESCENDING)
        docs = words_ref.stream()
        words_list = [doc.to_dict() for doc in docs]
        return jsonify(words_list), 200
    except Exception as e:
        print(f"Error in /api/words: {e}")
        return jsonify({"error": "An internal error occurred"}), 500

@app.route("/api/words/<word>", methods=['DELETE'])
def delete_word(word):
    if not db:
        return jsonify({"error": "Firestore not initialized"}), 500
    try:
        word = word.strip().lower()
        word_ref = db.collection('words').document(word)
        doc = word_ref.get()

        if not doc.exists:  # Changed from doc.exists() to doc.exists
            return jsonify({"error": "Word not found"}), 404

        word_ref.delete()
        return jsonify({"message": "Word deleted successfully"}), 200
    except Exception as e:
        print(f"Error in delete_word: {e}")
        return jsonify({"error": "An internal error occurred"}), 500

@app.route("/api/practice", methods=['GET'])
def get_practice_word():
    if not db:
        return jsonify({"error": "Firestore not initialized"}), 500
    try:
        words_ref = db.collection('words')
        all_words_docs = list(words_ref.limit(100).stream()) 
        if not all_words_docs:
            return jsonify({"error": "No words available for practice"}), 404

        # Create a list of (word_doc, weight) tuples for weighted selection
        weighted_words = []
        for doc in all_words_docs:
            word_data = doc.to_dict()
            # Higher weight means more likely to be selected
            weight = word_data.get('practice_weight', 10)  # Default weight of 10
            weighted_words.append((doc, weight))

        # Perform weighted random selection
        total_weight = sum(weight for _, weight in weighted_words)
        if total_weight == 0:  # If all weights are 0, use equal weights
            chosen_doc = random.choice(all_words_docs)
        else:
            r = random.uniform(0, total_weight)
            current_weight = 0
            chosen_doc = None
            for doc, weight in weighted_words:
                current_weight += weight
                if r <= current_weight:
                    chosen_doc = doc
                    break
            if not chosen_doc:  # Fallback in case of floating point issues
                chosen_doc = weighted_words[-1][0]

        word_data = chosen_doc.to_dict()
        correct_definition = word_data.get("definition")
        
        # Rest of the function remains the same...
        if not isinstance(correct_definition, str) or correct_definition.startswith("Error") or correct_definition.startswith("Definition service") or correct_definition.startswith("Could not retrieve"):
            print(f"Skipping word for practice due to problematic stored definition: {word_data.get('english_word')}")
            if len(all_words_docs) > 1:
                return get_practice_word()
            else:
                return jsonify({"error": "No suitable words for practice after filtering"}), 404

        # Generate distractor definitions...
        distractor_defs = []
        other_words_data = [doc.to_dict() for doc in all_words_docs if doc.id != chosen_doc.id]
        random.shuffle(other_words_data)
        
        for other_word_info in other_words_data:
            other_def = other_word_info.get("definition")
            if (isinstance(other_def, str) and 
                other_def != correct_definition and 
                not other_def.startswith("Error") and 
                not other_def.startswith("Definition service") and 
                not other_def.startswith("Could not retrieve") and
                len(other_def) > 10):
                distractor_defs.append(other_def)
                if len(distractor_defs) >= 2:
                    break
        
        while len(distractor_defs) < 2:
            if gemini_model:
                try:
                    prompt = f"Generate one plausible but incorrect dictionary definition for the English word '{word_data.get('english_word')}' that could be used as a distractor in a multiple-choice quiz. The correct definition is approximately: '{correct_definition[:100]}...'. Do not include the word itself in the distractor. Make it concise."
                    if distractor_defs:
                        prompt += f" Ensure it is different from: {'; '.join(distractor_defs)}."
                    gemini_response = gemini_model.generate_content(prompt)
                    if gemini_response.parts and gemini_response.text:
                        distractor_defs.append(gemini_response.text.strip())
                    else:
                        distractor_defs.append(f"Incorrect option {len(distractor_defs) + 1} (AI generated placeholder).")
                except Exception as e_gemini_distractor:
                    print(f"Error generating distractor with Gemini: {e_gemini_distractor}")
                    distractor_defs.append(f"Incorrect option {len(distractor_defs) + 1} (placeholder due to AI error).")
            else:
                 distractor_defs.append(f"Incorrect option {len(distractor_defs) + 1} (placeholder - AI not init).")

        options = [correct_definition] + distractor_defs
        random.shuffle(options)

        return jsonify({
            "english_word": word_data.get("english_word"),
            "options": options,
            "correct_definition": correct_definition 
        }), 200
    except Exception as e:
        print(f"Error in /api/practice: {e}")
        return jsonify({"error": "An internal error occurred"}), 500

@app.route("/api/answer", methods=['POST'])
def submit_answer():
    if not db:
        return jsonify({"error": "Firestore not initialized"}), 500
    try:
        data = request.get_json()
        english_word = data.get('word', '').strip().lower()
        is_correct = data.get('is_correct')

        if not english_word or is_correct is None:
            return jsonify({"error": "Word or correctness not provided"}), 400

        word_ref = db.collection('words').document(english_word)
        doc = word_ref.get()

        if not doc.exists():
            return jsonify({"error": "Word not found"}), 404

        current_data = doc.to_dict()
        current_weight = current_data.get('practice_weight', 10)
        correct_count = current_data.get('practice_correct_count', 0)
        incorrect_count = current_data.get('practice_incorrect_count', 0)

        update_fields = {}
        if is_correct:
            update_fields["practice_correct_count"] = firestore.Increment(1)
            update_fields["practice_weight"] = max(1, current_weight - 2 - (correct_count // 2)) 
        else:
            update_fields["practice_incorrect_count"] = firestore.Increment(1)
            update_fields["practice_weight"] = current_weight + 3 + incorrect_count
        
        word_ref.update(update_fields)
        
        return jsonify({"message": "Practice stats updated"}), 200
    except Exception as e:
        print(f"Error in /api/answer: {e}")
        return jsonify({"error": "An internal error occurred"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))