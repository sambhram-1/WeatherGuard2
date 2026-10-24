# WeatherGuard AI

WeatherGuard AI is a hyperlocal weather-monitoring and risk-awareness prototype. The repository contains a React/TypeScript dashboard and a separate FastAPI/Python backend prototype.

## Project structure

```text
WeatherGuard2/
├── src/
│   ├── components/       # React UI components
│   ├── hooks/            # React hooks
│   ├── services/         # Weather data helpers and risk calculations
│   └── types/            # Shared TypeScript types
├── backend/
│   ├── app.py            # FastAPI endpoints
│   ├── weather_guard_ml.py
│   └── requirements.txt
├── index.html
├── package.json
└── README.md
```

## Run the frontend

Requirements: Node.js and npm (or Bun).

```bash
npm install
npm run dev
```

Vite prints the local URL when the server starts.

## Run the Python API

Requirements: Python 3.10+ recommended.

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r backend/requirements.txt
python backend/app.py
```

The API runs at `http://localhost:8000`. Interactive API documentation is available at `http://localhost:8000/docs`.

## Important implementation notes

- The React frontend currently includes its own TypeScript risk-calculation and weather-service modules. The Python FastAPI backend is organized separately; do not assume the frontend is calling it unless you explicitly configure and test that integration.
- The Python ML module trains Random Forest models using generated/synthetic training data. Its predictions are a prototype, not a validated operational severe-weather forecast. Do not use its scores as official warnings.
- Weather data availability depends on the external Open-Meteo services and network access. The app may fall back to simulated data.
- This repository is a student project/prototype. Risk scores and guidance should not replace official meteorological alerts or emergency services.

## Tests

Frontend build:

```bash
npm run build
```

Python API can be checked locally at `/docs` after starting it. Automated Python test coverage has not yet been added.

## Contributing / ownership

This project may build on AI-assisted generated code. Review, understand, test, and document changes you make. In your portfolio, describe your actual contributions accurately.
