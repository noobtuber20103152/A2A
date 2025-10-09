# 🧠 A2A — Multi-Agent System

## Overview

**A2A** is a modular **multi-agent system** that combines specialized agents to handle diverse tasks such as code generation, recipe recommendations, and movie suggestions. Each agent works independently but can collaborate for complex queries.

### Agents

* **Code Agent** – Generates and analyzes code.
* **Recipe Agent** – Provides meal ideas and nutrition info.
* **Movie Agent** – Recommends and analyzes movies.
* **Food Order Agent** – Extends recipe functionality for ordering and pricing.

---

## Project Structure

```
A2A/
├── client-agent/
├── external-agents/
│   ├── code-agent/
│   ├── food-order-agent/
│   ├── movie-agent/
├── frontend/
├── basePrompt.ts
├── generateText.ts
├── index.ts
└── package.json
```

---

## Setup

### 1️⃣ Clone and Install

```bash
git clone https://github.com/noobtuber20103152/A2A.git
cd A2A
```

### 2️⃣ Install and Run Each Service

Each folder requires setup and a dev server:

```bash
cd client-agent && npm install && npm run dev
cd ../external-agents/code-agent && npm install && npm run dev
cd ../external-agents/food-order-agent && npm install && npm run dev
cd ../external-agents/movie-agent && npm install && npm run dev
cd ../../frontend && npm install && npm run dev
```

---

## Usage

Try natural prompts that trigger one or more agents.

### Code + Recipe

* “Find breakfast recipes and generate code to calculate calories.”
* “Get dinner ideas and create a shopping list script.”

### Code + Movie

* “List top thrillers and generate rating visualization code.”
* “Find Pixar movies and compare box office data.”

### Recipe + Movie

* “Suggest cozy movies with snack pairings.”
* “List romantic comedies and matching dinners.”

### All Three

* “Plan a movie night with meals and generate code for a schedule.”
* “Create themed movie recipes and export as a webpage or PDF.”

---

## Architecture

* **Agents:** Independent domain modules.
* **Orchestrator:** Coordinates multi-agent responses.
* **Frontend:** Provides unified user interface.

---


