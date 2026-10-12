# L’Académie du Français

A responsive French-learning website with English explanations, structured lessons from beginner to advanced, vocabulary cards, quizzes, pronunciation practice, certificates, and locally saved progress.

## Run locally

1. Install Node.js 20 or newer.
2. In this folder, run `npm start`.
3. Open [http://localhost:3000](http://localhost:3000).

The lessons and practice tools run locally without an API key or external AI service.

## Production notes

Deploy the folder to a Node.js host. Learner progress and the demo profile currently live in that browser’s local storage; the sign-in screen is a local profile prompt, not production authentication or cross-device account sync. Add a proper identity provider and database before collecting accounts or promising synced progress.
