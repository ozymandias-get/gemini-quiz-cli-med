

**Languages:** [English](README.md) · [Türkçe](README.tr.md)

# QuizLab Med — AI quizzes from PDFs (Tauri desktop)

**QuizLab Med** is a **Tauri 2** desktop app that turns **PDF lecture notes and books** into **customizable, AI-generated quizzes** and **flashcards** for study (including medical and academic PDFs). Upload a PDF; questions and cards are produced via the **Google Gemini CLI**. The app does **not** bundle a `GEMINI_API_KEY` or call in-browser `@google/genai` — authentication and keys stay on the **CLI side**.

**Window title:** QuizLab · **App identifier:** `com.quizlab.med` · Project is in early development (`0.0.0`).

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development](#development)
- [Production build](#production-build)
- [FAQ](#faq)
- [References](#references)

## Features

- **Quiz from PDF:** Upload notes or books as PDF; text is analyzed and questions are generated with the Gemini stack (roughly **20 MB / 500 pages** upper limit).
- **Customization:** Question count, **difficulty**, and **question style**; multiple **Gemini** model options (e.g. Pro, Flash, Flash-Lite — as labeled in the UI).
- **Focus topic:** Target a single topic (e.g. “Mitosis”, “Heart failure”) instead of the whole file.
- **Style cloning:** Upload an example question so the model can match tone and structure.
- **Active learning:** Multiple-choice quiz, **flashcard** mode, and per-question solution / “why was this wrong?”-style explanations.
- **Languages:** UI supports **Turkish** and **English**.
- **Session:** Demo quiz and resume unfinished quiz flows.
- **Desktop:** Native app experience on Windows (and other targets per Tauri configuration).

## Tech stack


| Layer    | Technologies                                                                                                                                                                                                                                                                               |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Frontend | [Vite](https://vitejs.dev/) 6, [React](https://react.dev/) 19, TypeScript, [Tailwind CSS](https://tailwindcss.com/) 4, [Framer Motion](https://www.framer.com/motion/), [Zustand](https://zustand-demo.pmnd.rs/), [pdfjs-dist](https://github.com/mozilla/pdf.js), [Zod](https://zod.dev/) |
| Desktop  | [Tauri](https://v2.tauri.app/) 2, Rust                                                                                                                                                                                                                                                     |
| AI       | [Google Gemini CLI](https://github.com/google-gemini/gemini-cli) (`@google/gemini-cli`)                                                                                                                                                                                                    |


## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [Rust](https://rustup.rs/) (with Cargo)
- **Gemini CLI** — global install recommended:
  ```bash
  npm install -g @google/gemini-cli
  gemini --version
  ```
  The app tries `gemini` / `gemini.cmd` first; if missing, it falls back to **`npx -y @google/gemini-cli`**. **Node.js** and **`npx`** must be on **PATH** (a desktop shortcut may not see a global `gemini`; the `npx` fallback covers that). Sign in or configure an API key **in the CLI** ([Gemini CLI](https://github.com/google-gemini/gemini-cli)).

Optional: `cargo install tauri-cli` for `cargo tauri` commands; otherwise use `**npx @tauri-apps/cli`** as in this repo.

## Installation

```bash
npm install
```

## Development

Runs the Vite frontend and attaches the Tauri window (full desktop; AI generation requires the CLI):

```bash
npm run tauri:dev
```

Web-only frontend (no Tauri). **AI calls do not work in this mode:**

```bash
npm run dev
```

## Production build

```bash
npm run tauri:build
```

Outputs are under `src-tauri/target/release/` and `src-tauri/target/release/bundle/` (e.g. Windows `.msi` and `.exe` installers).

## FAQ

**Why is there no API key inside the app?**  
Generation goes through the Gemini CLI, so keys or session data are not embedded in the build; configuration lives in the user environment and CLI.

**How do I verify Gemini CLI?**  
Run `gemini --version` in a terminal. The desktop app may also show CLI status in the UI.

**Why doesn’t `npm run dev` generate quizzes?**  
Plain web dev mode does not use the Tauri shell; AI integration in this project is tied to the desktop / CLI flow. Use `npm run tauri:dev` for the full experience.

**What file types are supported?**  
The flow is PDF-focused; limits match the in-app hints (size and page caps).

## References

- [Gemini CLI on GitHub](https://github.com/google-gemini/gemini-cli)

