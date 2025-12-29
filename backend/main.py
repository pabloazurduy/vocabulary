import os
import requests  # For DictionaryAPI (potentially remove if fully replaced)
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from google.cloud import firestore
from google import genai  # New Gemini SDK
import random

# Initialize Flask App
app = Flask(__name__, 
            static_url_path='', 
            static_folder='../') # Serve files from parent directory
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
    gemini_client = genai.Client(api_key=gemini_api_key)
    gemini_model = 'gemini-2.0-flash-lite'  # Model name for the new SDK
except ValueError as ve:
    print(f"Configuration error for Gemini: {ve}")
    gemini_client = None
    gemini_model = None
except Exception as e:
    print(f"Error initializing Google Gemini client: {e}")
    gemini_client = None
    gemini_model = None

# --- External API Functions (Now using Gemini) ---
def get_word_data_with_gemini(word):
    """Fetches both definition and translation from Gemini API in a single call."""
    if not gemini_client or not gemini_model:
        return {
            "definition": "Definition service not available (Gemini not initialized).",
            "translation": "Translation service not available (Gemini not initialized)."
        }
    try:
        # Create a structured prompt that explicitly requests JSON format
        prompt = f"""
        Analyze the English word '{word}' and provide the following information in JSON format:
        1. most_probable_definition: The most accurate and concise definition in English (REQUIRED)
        2. most_probable_translation: The most accurate Spanish translation (REQUIRED)
        3. other_definitions: List any other common definitions or senses of the word (OPTIONAL - can be an empty array if there are no other common definitions)
        4. other_translations: List any other Spanish translations that might apply in different contexts (OPTIONAL - can be an empty array if there are no other common translations)
        
        CRITICALLY IMPORTANT: 
        - Respond ONLY with valid JSON format
        - Do not include any explanations before or after the JSON
        - The only required fields are most_probable_definition and most_probable_translation
        - If there are no alternative definitions or translations, use empty arrays for those fields
        
        Example format:
        {{
          "most_probable_definition": "your definition here", 
          "most_probable_translation": "your translation here",
          "other_definitions": [], 
          "other_translations": []
        }}
        
        If the word has multiple meanings, provide the most common definition as most_probable_definition and include others as other_definitions.
        """
        
        response = gemini_client.models.generate_content(
            model=gemini_model,
            contents=prompt
        )
        
        if response.candidates and response.candidates[0].content.parts:
            result_text = response.text
            # Try to extract JSON content if surrounded by markdown code blocks
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()
                
            # Try to parse the JSON response
            import json
            try:
                parsed_data = json.loads(result_text)
                
                # Validate that required fields exist
                definition = parsed_data.get("most_probable_definition", "")
                translation = parsed_data.get("most_probable_translation", "")
                # Ensure these are arrays, even if empty
                other_definitions = parsed_data.get("other_definitions", [])
                if not isinstance(other_definitions, list):
                    other_definitions = []
                other_translations = parsed_data.get("other_translations", [])
                if not isinstance(other_translations, list):
                    other_translations = []
                
                # Do some basic validation
                if not definition or not translation:
                    print(f"Gemini response missing required fields for '{word}': {result_text}")
                    return {
                        "definition": f"Could not retrieve a clear definition for '{word}' from the AI.",
                        "translation": f"Could not retrieve a clear translation for '{word}' from the AI.",
                        "other_definitions": [],
                        "other_translations": []
                    }
                
                return {
                    "definition": definition,
                    "translation": translation,
                    "other_definitions": other_definitions,
                    "other_translations": other_translations
                }
                
            except json.JSONDecodeError as e:
                print(f"Failed to parse Gemini response as JSON for '{word}': {e}. Response: {result_text}")
                # Fall back to simple extraction if JSON parsing fails
                lines = result_text.strip().split('\n')
                if len(lines) >= 2:
                    return {
                        "definition": lines[0].strip(),
                        "translation": lines[1].strip(),
                        "other_definitions": [],
                        "other_translations": []
                    }
        
        print(f"Gemini API: Unexpected response format for '{word}'. Response: {response}")
        return {
            "definition": f"Could not process response for '{word}' from AI.",
            "translation": f"Could not process translation for '{word}' from AI.",
            "other_definitions": [],
            "other_translations": []
        }
    except Exception as e:
        print(f"Gemini API: Error getting data for '{word}': {e}")
        return {
            "definition": f"Error during lookup with AI: {str(e)}",
            "translation": f"Error during translation with AI: {str(e)}",
            "other_definitions": [],
            "other_translations": []
        }
# --- API Endpoints ---

# Serve static files and handle frontend routes
@app.route('/', defaults={'path': 'index.html'})
@app.route('/search', defaults={'path': None})
def search_route(path=None):
    """Handle search route with query parameters"""
    # Serve index.html for /search route to handle client-side
    return send_from_directory('../', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files or return index.html for frontend route handling"""
    # Try to serve the requested file
    try:
        return send_from_directory('../', path)
    except:
        # If the file doesn't exist, return index.html (for SPA routing)
        return send_from_directory('../', 'index.html')

@app.route("/api/search", methods=['POST'])
def search_word():
    if not db:
        return jsonify({"error": "Firestore not initialized"}), 500
    if not gemini_client or not gemini_model:
        return jsonify({"error": "AI service (Gemini) not initialized"}), 500
        
    try:
        data = request.get_json()
        english_word = data.get('word', '').strip()

        if not english_word:
            return jsonify({"error": "Word not provided"}), 400

        word_ref = db.collection('words').document(english_word.lower())
        doc = word_ref.get()

        if doc.exists:  # Word already exists in the database
            word_data = doc.to_dict()
            # Update view count and last_viewed_at timestamp
            word_ref.update({
                "view_count": firestore.Increment(1),
                "last_viewed_at": firestore.SERVER_TIMESTAMP
            })
            word_data['view_count'] = word_data.get('view_count', 0) + 1
            return jsonify(word_data), 200
        else:
            # Get word data using the combined function
            gemini_data = get_word_data_with_gemini(english_word)
            
            # Extract the primary definition and translation
            definition = gemini_data.get("definition")
            translation = gemini_data.get("translation")
            other_definitions = gemini_data.get("other_definitions", [])
            other_translations = gemini_data.get("other_translations", [])
            
            # Validate the data
            if not definition or definition.startswith("Error") or definition.startswith("Definition service not available") or definition.startswith("Could not retrieve"):
                definition = "Definition not found or AI service error."
                translation = "Translation not available due to definition error."
                other_definitions = []
                other_translations = []
            
            if not translation or translation.startswith("Error") or translation.startswith("Translation service") or translation.startswith("Could not reliably translate"):
                translation = "Translation failed or AI service error."
                other_translations = []

            # Create the new word entry with all available data
            new_word_data = {
                "english_word": english_word,
                "definition": definition,
                "translation": translation,
                "other_definitions": other_definitions,
                "other_translations": other_translations,
                "view_count": 1,
                "practice_correct_count": 0,
                "practice_incorrect_count": 0,
                "created_at": firestore.SERVER_TIMESTAMP,
                "last_viewed_at": firestore.SERVER_TIMESTAMP
            }
            
            # Store in database
            word_ref.set(new_word_data)
            
            # Create a serializable copy of the data for the response
            # Replace SERVER_TIMESTAMP with None or current time for JSON serialization
            response_data = {
                "english_word": english_word,
                "definition": definition,
                "translation": translation,
                "other_definitions": other_definitions,
                "other_translations": other_translations,
                "view_count": 1,
                "practice_correct_count": 0,
                "practice_incorrect_count": 0,
                # Don't include created_at in the response or use a serializable value
            }
            
            return jsonify(response_data), 201
    except Exception as e:
        print(f"Error in /api/search: {e}")
        return jsonify({"error": f"An internal error occurred: {str(e)}"}), 500

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
            if gemini_client and gemini_model:
                try:
                    prompt = f"Generate one plausible but incorrect dictionary definition for the English word '{word_data.get('english_word')}' that could be used as a distractor in a multiple-choice quiz. The correct definition is approximately: '{correct_definition[:100]}...'. Do not include the word itself in the distractor. Make it concise."
                    if distractor_defs:
                        prompt += f" Ensure it is different from: {'; '.join(distractor_defs)}."
                    gemini_response = gemini_client.models.generate_content(
                        model=gemini_model,
                        contents=prompt
                    )
                    if gemini_response.candidates and gemini_response.candidates[0].content.parts:
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

        if not doc.exists:  # Fixed: removed parentheses, using 'exists' as an attribute
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