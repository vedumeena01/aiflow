# ⚡ AutoFlow AI — Autonomous Multi-Agent Orchestration Studio

[![React 18](https://img.shields.io/badge/React-18.3-61dafb.svg?style=flat-square&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg?style=flat-square&logo=vite)](https://vitejs.dev/)
[![LangGraph Compatible](https://img.shields.io/badge/LangGraph-Compatible-blue.svg?style=flat-square)](https://github.com/langchain-ai/langgraph)
[![Claude 3.5 Sonnet](https://img.shields.io/badge/Claude%203.5-Sonnet-D97706.svg?style=flat-square)](https://www.anthropic.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

> **AutoFlow AI** is a visual studio for designing, testing, and deploying autonomous multi-agent pipelines with direct LLM inference, AMQP message queues, self-correcting feedback loops, and 1-click production code export to LangGraph and TypeScript.

---

## 🚀 Key Architectural Highlights

- **Visual Infinite Canvas**: Smooth pan and zoom (25%–180%), cubic Bezier connections with real-time particle effects, port-based topological wiring, and cycle loop detection.
- **Multi-Provider Live AI Inference**: Direct client-side inference using **Anthropic Claude 3.5 Sonnet**, **Google Gemini 1.5 Pro / Flash**, **Groq Llama 3.3 70B**, and **OpenAI**.
- **Ralph Autonomous Self-Correction Loop**: Iterative evaluation node that gates output based on configurable threshold criteria and maximum retry limits.
- **Enterprise AMQP Messaging**: Distributed `rabbitmq_trigger` consumer and `rabbitmq_publish` dispatcher nodes.
- **Action Safety Verification**: Pre-execution security filter that analyzes prompts and payloads for credential leakage, destructive operations, or malicious behavior.
- **1-Click Code Exporter (`</> Export Code`)**: Compiles any visual canvas pipeline directly into production **Python LangGraph (`StateGraph`)** or typed **TypeScript (Node.js)** code.
- **Live Pipeline Chat Playground**: Interactive slide-out drawer allowing natural language prompting of the active visual graph with node-by-node reasoning traces and latency/token telemetry.
- **Deterministic DAG Validation**: Kahn's topological sort algorithm blocks execution if circular loops are detected and highlights offending nodes in crimson.
- **Undo / Redo Command History**: Granular state tracking (`Ctrl+Z` / `Ctrl+Y`) across canvas manipulations.

---

## 🛠️ Architecture & Directory Structure

```
aiflow/
├── src/
│   ├── components/
│   │   ├── Canvas.jsx            # Infinite dot-grid viewport & Bezier wire engine
│   │   ├── NodeCard.jsx          # Color-coded interactive node cards with I/O handles
│   │   ├── NodeInspector.jsx     # Configuration drawer for parameters, prompts & thresholds
│   │   ├── Header.jsx            # Action bar: Code Export, Chat Playground, Live/Sim toggle
│   │   ├── Sidebar.jsx           # Node category palette with search and drag-and-drop
│   │   ├── ExecutionConsole.jsx  # 3-state pinned log drawer with payload inspection
│   │   ├── ChatPlayground.jsx    # Conversational drawer with reasoning traces & telemetry
│   │   ├── CodeExportModal.jsx   # Modal with LangGraph Python & TypeScript code export
│   │   └── ApiSettingsModal.jsx  # Credential manager for Gemini, Anthropic, Groq, OpenAI
│   ├── services/
│   │   └── aiService.js          # Direct client-side inference & safety verification engine
│   ├── utils/
│   │   ├── codeGenerator.js      # Python LangGraph & TypeScript code compilation engine
│   │   └── graphValidation.js    # Kahn's DAG cycle detection & topological ordering
│   ├── data/
│   │   ├── nodeDefinitions.js    # Node catalog: Ralph Loop, GSD, RabbitMQ, LLMs, Actions
│   │   └── templates.js          # Enterprise templates (e.g. Ralph Loop + RabbitMQ)
│   ├── App.jsx                   # Central state machine & execution orchestrator
│   ├── main.jsx                  # React DOM mount point
│   └── index.css                 # Dark obsidian cyberpunk design system
├── index.html
├── package.json
└── vite.config.js
```

---

## ⚡ Quickstart & Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0 or higher)
- `npm` or `yarn`

### Installation
```bash
# Clone the repository
git clone https://github.com/vedumeena01/aiflow.git
cd aiflow

# Install dependencies
npm install

# Launch Vite development server
npm run dev
```

Visit `http://localhost:5173/` in your browser.

---

## 💻 Exported Code Compatibility

### Python (LangGraph)
Pipelines exported from the studio directly utilize `langgraph.graph.StateGraph`:
```python
from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END
from langchain_anthropic import ChatAnthropic

class WorkflowState(TypedDict):
    input: str
    output: str
    history: list

workflow = StateGraph(WorkflowState)
# Nodes and conditional edges are automatically bound
```

### TypeScript / Node.js
Exported TypeScript pipelines include step-by-step state dictionaries, topological execution order, and error handling out-of-the-box.

---

## 📜 License
MIT License © 2026 Ved Prakash Meena.
