# Mind Match - Bachelor Party Game

A real-time multiplayer party game inspired by "Wavelength", designed for a Bachelor Party.

## How to Play

1.  **The Host** opens the game on a big screen (TV/Laptop).
2.  **Players** join by scanning the QR code on their phones.
3.  **Teams** are formed.
4.  **The Bachelor** (or a designated player) is given a "Prompt" (e.g., "Hot <-> Cold") and sets a hidden target on a spectrum.
5.  **Teams** discuss and submit their guess on where the Bachelor placed the target.
6.  **Reveal!** Points are awarded based on how close the teams were to the Bachelor's truth.

## Features

*   **Two Game Modes:**
    *   **Concepts:** Scale between two opposites (e.g., "Trashy <-> Classy").
    *   **Agree/Disagree:** Respond to a statement (e.g., "Pineapple belongs on pizza").
*   **Real-time Multiplayer:** Using Socket.io for instant updates.
*   **Team Scoring:** Teams compete for the high score.
*   **Mobile Friendly:** Players use their phones as controllers.

## Running Locally

1.  **Install Dependencies:**
    ```bash
    npm install
    cd client && npm install
    cd ../server && npm install
    cd ..
    ```

2.  **Start the Game:**
    ```bash
    npm start
    ```
    This will start both the backend (port 3001) and frontend (port 5173/3000).

3.  **Access the Game:**
    *   **Host:** Go to `http://localhost:5173/?host=true`
    *   **Players:** Go to `http://localhost:5173/` (or scan the QR code).

    *Note: To allow friends to join on your Wi-Fi, you need to use your computer's local IP address (e.g., `192.168.1.x`) instead of `localhost`.*

## Customizing Content

You can add your own inside jokes and topics!

1.  Open `server/game_content.js`.
2.  Add new pairs to the `concepts` array: `["My Joke Left", "My Joke Right"]`.
3.  Add new statements to the `statements` array: `"The Bachelor has a secret tattoo."`.
4.  Restart the server (`npm start`) to see changes.

## Deployment (Optional)

To play over the internet, you can deploy this to a service like **Render** or **Heroku**.

### Deploying to Render (Free Tier)

1.  Push this code to a GitHub repository.
2.  Create a new **Web Service** on Render connected to your repo.
3.  **Build Command:** `npm install && cd client && npm install && npm run build && cd ../server && npm install`
    *   *Note: This might need adjustment for a monorepo. Simpler approach is to deploy server and client separately or serve client static files from server.*
4.  **Start Command:** `cd server && node index.js`
5.  **Environment Variables:**
    *   You might need to update the Client to point to the production Server URL instead of `localhost:3001`.

### Simplified Deployment (Serving Client from Server)

For easiest deployment:
1.  Run `cd client && npm run build` locally.
2.  Move the `client/dist` folder to `server/public`.
3.  Update `server/index.js` to serve static files from `public`.
4.  Deploy only the `server` folder.

## Tech Stack

*   **Frontend:** React + Vite
*   **Backend:** Node.js + Express + Socket.io
