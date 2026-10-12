# L’Académie du Français

A responsive French-learning website with English explanations and Hindi lesson notes, beginner-to-advanced lessons, vocabulary cards translated into English and Hindi, quizzes, pronunciation practice, certificates, and locally saved progress.

## Run locally

1. Install Node.js 20 or newer.
2. In this folder, run npm start.
3. Open http://localhost:3000.

Lessons and practice tools run locally without an API key or external AI service.

## Production notes

Learner progress and the demo profile live in the browser’s local storage. The sign-in screen is a local profile prompt, not production authentication or cross-device account sync. Add a proper identity provider and database before collecting accounts or promising synced progress.
