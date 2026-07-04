# GameGrid Tournament Auction Module - Frontend

This is the React client interface for the tournament bidding engine, built using Vite, TypeScript, and Material UI.

## Tech Stack
* **Runtime / Framework**: React 18 / TypeScript
* **Design Engine**: Material UI (MUI) v5/v6 (styled with cyberpunk dark theme defaults)
* **Build System**: Vite
* **API Client**: Axios
* **Icons Library**: Lucide React

---

## Directory Structure
* [src/api.ts](file:///C:/Users/kisho/.gemini/antigravity/scratch/gamegrid/frontend/src/api.ts) - Axioms client mapping backend connection rules.
* [src/theme.ts](file:///C:/Users/kisho/.gemini/antigravity/scratch/gamegrid/frontend/src/theme.ts) - MUI palette configs, button overrides, and typography definitions.
* [src/App.tsx](file:///C:/Users/kisho/.gemini/antigravity/scratch/gamegrid/frontend/src/App.tsx) - SPA frame manager coordinating views layout.
* **Views Directory**:
  * [ImportPlayersView.tsx](file:///C:/Users/kisho/.gemini/antigravity/scratch/gamegrid/frontend/src/views/ImportPlayersView.tsx) - Drag-drop uploader for player spreadsheets.
  * [AuctionsListView.tsx](file:///C:/Users/kisho/.gemini/antigravity/scratch/gamegrid/frontend/src/views/AuctionsListView.tsx) - Search/paging listing showing tournament states.
  * [AuctionFormView.tsx](file:///C:/Users/kisho/.gemini/antigravity/scratch/gamegrid/frontend/src/views/AuctionFormView.tsx) - Form wizard detailing auction regulations and teams setup.
  * [AuctionDashboardView.tsx](file:///C:/Users/kisho/.gemini/antigravity/scratch/gamegrid/frontend/src/views/AuctionDashboardView.tsx) - Multi-panel bidding terminal showing active timers and bidding logs.
  * [TeamRostersView.tsx](file:///C:/Users/kisho/.gemini/antigravity/scratch/gamegrid/frontend/src/views/TeamRostersView.tsx) - printable sheets and file checkout routes.

---

## Getting Started

### 1. Install Dependencies
Make sure you have Node.js installed, navigate to the `frontend/` directory, and pull packages:
```bash
npm install
```

### 2. Configure Backend Server Address
By default, the client directs calls to `http://localhost:8084/api` configured in `src/api.ts`. Modify this string if running the server on a custom port.

### 3. Launch Development Server
Start the local Vite dev server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Production Build
Compile the application into static distribution assets under the `dist/` directory:
```bash
npm run build
```
This runs TypeScript compiling tests (`tsc`) followed by the Vite production build minifier.
