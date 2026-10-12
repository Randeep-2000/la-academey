# L’Académie du Français

A responsive French-learning website based on the supplied HTML reference. It includes a structured learning dashboard, beginner-to-advanced lesson navigation, vocabulary cards, quizzes, pronunciation practice, saved local progress, and an English/Hindi AI tutor.

## Run locally

1. Install Node.js 20 or newer.
2. In this folder, set `OPENAI_API_KEY` in your shell or deployment environment. You can set `OPENAI_MODEL` to another model available to your API project.
3. Run `npm start` and open [http://localhost:3000](http://localhost:3000).

The AI key is read only by the server and never sent to the browser. Without a key, the tutor shows a setup message; the lessons and practice tools still work. The AI tutor uses the OpenAI Responses API. See the [official API reference](https://developers.openai.com/api/reference/resources/responses/methods/create).

## Production notes

Deploy the folder to a Node.js host that supports outbound HTTPS and set the environment variables there. Learner progress and the demo profile currently live in that browser’s local storage; the sign-in screen is a local profile prompt, not production authentication or cross-device account sync. Add a proper identity provider and database before collecting accounts or promising synced progress. Add an HTTPS domain and configure the hosting provider’s request limits for production.
