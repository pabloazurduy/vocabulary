#!/usr/bin/env python3
"""
Script to search for all words in words.txt file and store them in Firebase.
This script calls the /api/search endpoint for each word and waits for the response
before proceeding to the next word.
"""

import os
import sys
import time
import requests
from pathlib import Path

# Configuration
WORDS_FILE = Path(__file__).parent / "words.txt"
API_URL = "http://127.0.0.1:8080/api/search"  # Adjust if your API runs on a different port
DELAY = 1  # Seconds to wait between requests to avoid overwhelming the API
MAX_RETRIES = 5  # Maximum number of retries for failed requests

def read_words_from_file(file_path):
    """Read all words from the specified file."""
    words = []
    try:
        with open(file_path, 'r') as f:
            for line in f:
                word = line.strip()
                if word and not word.startswith("//"):  # Skip comments and empty lines
                    words.append(word)
        return words
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
        sys.exit(1)

def search_word(word):
    """Search for a word using the API and store it in Firebase."""
    retry_count = 0
    
    while retry_count <= MAX_RETRIES:
        try:
            if retry_count == 0:
                print(f"Searching for word: {word}")
            else:
                print(f"Retrying search for word: {word} (Attempt {retry_count+1}/{MAX_RETRIES+1})")
                
            response = requests.post(
                API_URL,
                json={"word": word},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Word '{word}' already exists in database.")
                return True
            elif response.status_code == 201:
                result = response.json()
                print(f"✅ Word '{word}' successfully added to database.")
                return True
            else:
                print(f"❌ Error searching for word '{word}': {response.status_code} - {response.text}")
                
                # If we've reached the maximum number of retries, give up
                if retry_count >= MAX_RETRIES:
                    print(f"⚠️ Maximum retries reached for word '{word}'. Moving on...")
                    return False
                
                # Calculate exponential backoff delay: 2^n seconds
                backoff_delay = 2 ** retry_count
                print(f"Waiting {backoff_delay} seconds before retrying...")
                time.sleep(backoff_delay)
                retry_count += 1
                
        except Exception as e:
            print(f"❌ Exception while searching for word '{word}': {e}")
            
            # If we've reached the maximum number of retries, give up
            if retry_count >= MAX_RETRIES:
                print(f"⚠️ Maximum retries reached for word '{word}'. Moving on...")
                return False
            
            # Calculate exponential backoff delay: 2^n seconds
            backoff_delay = 2 ** retry_count
            print(f"Waiting {backoff_delay} seconds before retrying...")
            time.sleep(backoff_delay)
            retry_count += 1
    
    return False

def main():
    """Main function to process all words."""
    # Check if the words file exists
    if not WORDS_FILE.exists():
        print(f"Error: Words file not found at {WORDS_FILE}")
        sys.exit(1)
    
    # Read all words from the file
    words = read_words_from_file(WORDS_FILE)
    print(f"Found {len(words)} words to process.")
    
    # Process each word
    success_count = 0
    failure_count = 0
    
    for index, word in enumerate(words):
        print(f"Processing word {index+1}/{len(words)}: {word}")
        
        # Search for the word and store it in Firebase
        if search_word(word):
            success_count += 1
        else:
            failure_count += 1
        
        # Wait before processing the next word
        if index < len(words) - 1:  # Don't delay after the last word
            print(f"Waiting {DELAY} seconds before processing next word...")
            time.sleep(DELAY)
    
    # Print summary
    print("\n--- Summary ---")
    print(f"Total words processed: {len(words)}")
    print(f"Successful: {success_count}")
    print(f"Failed: {failure_count}")

if __name__ == "__main__":
    main()
