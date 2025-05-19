# English-Spanish Vocabulary Learning Application

A lightweight vocabulary application that helps users learn English words by looking up definitions, translating to Spanish, storing words for later review, and testing knowledge through a quiz system.

## Features

- **Word Search**: Look up English word definitions and Spanish translations
- **Practice Mode**: Test your knowledge with a quiz system that adapts to your learning progress
- **Word List View**: View and manage your personal vocabulary collection
- **Lightweight**: Designed for minimal resource usage and personal use

## Tech Stack

- **Frontend**: HTML, CSS (Tailwind), JavaScript
- **Backend**: Python (Flask)
- **Database**: Firebase Firestore
- **AI**: Google Gemini API (Gemma 3 12 Instruct model)
- **Deployment**: Google Cloud Run

## Project Structure

```
├── cloudbuild.yaml      # Google Cloud Build configuration
├── Dockerfile           # Container configuration
├── index.html           # Main HTML file
├── backend/
│   ├── main.py          # Python backend code
│   └── requirements.txt # Python dependencies
├── css/
│   └── styles.css       # Tailwind and custom styles
└── js/
    ├── api.js           # API handling code
    ├── app.js           # Main application logic
    └── navigation.js    # Tab navigation logic
```

## Setup & Installation

### Prerequisites

- Google Cloud account
- Firebase project
- Gemini API key

### Local Development

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/vocabulary.git
   cd vocabulary
   ```

2. Set up Firebase:
   - Create a new Firebase project at [firebase.google.com](https://firebase.google.com)
   - Enable Firestore database
   - Set up Firebase credentials

3. Set up a Gemini API key:
   - Go to [ai.google.dev](https://ai.google.dev/tutorials/setup)
   - Create an API key

4. Set environment variables:
   ```
   export GEMINI_API_KEY="your-gemini-api-key"
   ```

5. Install Python dependencies:
   ```
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

6. Run the application locally:
   ```
   python backend/main.py
   ```

## Deployment to Google Cloud Run

### Option 1: Manual Deployment

1. Create a Google Cloud project:
   ```
   gcloud projects create your-project-id
   gcloud config set project your-project-id
   ```

2. Store your Gemini API key in Secret Manager:
   ```
   echo -n "your-gemini-api-key" | gcloud secrets create gemini-api-key --data-file=-
   ```

3. Build and deploy using Cloud Build:
   ```
   gcloud builds submit --config cloudbuild.yaml
   ```

### Option 2: Setup CI/CD with GitHub

1. Connect your GitHub repository to Google Cloud Build
2. Set up the necessary triggers to build on push to main branch
3. Store your Gemini API key in Secret Manager as shown above

## Usage

1. **Search**: Enter an English word to see its definition and Spanish translation
2. **Practice**: Test your knowledge with randomly selected words from your collection
3. **Word List**: View, search, and manage your saved vocabulary

## Design Considerations

- **Low Resource Usage**: Optimized for personal use with minimal API calls
- **Mobile-First Design**: Responsive UI works well on both desktop and mobile
- **Cost Optimization**: Serverless architecture with zero minimum instances to minimize cloud costs