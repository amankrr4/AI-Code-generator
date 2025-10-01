# AI Code Assistant - Full Stack Application

A modern AI-powered code assistant built with React and Node.js, designed for seamless deployment on Railway (backend) and Vercel (frontend).

## 🚀 Features

- **Multi-Model Support**: GPT-4, GPT-3.5, Claude, Gemini, and Ollama
- **Code Generation**: Generate code in multiple programming languages
- **Syntax Highlighting**: Beautiful code display with syntax highlighting
- **Responsive Design**: Modern, dark-themed UI with smooth animations
- **Real-time Chat**: Interactive chat interface with message history

## 🛠️ Tech Stack

### Frontend
- React 19
- Vite
- React Syntax Highlighter
- CSS3 with custom animations

### Backend
- Node.js with Express
- CORS enabled
- Environment-based configuration
- Multiple AI model integrations

## 📦 Installation & Setup

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd swe-agent-project
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd my-react-app
   npm install
   cp env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
OLLAMA_URL=http://localhost:11434
# Optional: Set default API keys
OPENAI_API_KEY=your_openai_key
CLAUDE_API_KEY=your_claude_key
GEMINI_API_KEY=your_gemini_key
```

#### Frontend (.env)
```env
# For development, leave empty to use localhost
# For production, set to your Railway backend URL
VITE_API_URL=https://your-backend.railway.app
```

