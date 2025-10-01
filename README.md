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

## 🚀 Deployment

### Backend Deployment (Railway)

1. **Connect to Railway**
   - Go to [Railway.app](https://railway.app)
   - Connect your GitHub repository
   - Select the `backend` folder

2. **Configure Environment Variables**
   ```env
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend.vercel.app
   OPENAI_API_KEY=your_openai_key
   CLAUDE_API_KEY=your_claude_key
   GEMINI_API_KEY=your_gemini_key
   ```

3. **Deploy**
   - Railway will automatically detect the Node.js project
   - The app will be available at `https://your-app.railway.app`

### Frontend Deployment (Vercel)

1. **Connect to Vercel**
   - Go to [Vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set root directory to `my-react-app`

2. **Configure Environment Variables**
   ```env
   VITE_API_URL=https://your-backend.railway.app
   ```

3. **Deploy**
   - Vercel will automatically build and deploy
   - The app will be available at `https://your-app.vercel.app`

## 🔧 Configuration

### API Keys

You can provide API keys in two ways:
1. **Environment Variables**: Set in Railway/Vercel dashboard
2. **User Input**: Enter in the app's model selector

### Supported Models

- **OpenAI**: GPT-4, GPT-3.5-turbo
- **Anthropic**: Claude-3.5-Sonnet
- **Google**: Gemini-2.5-Flash, Gemini-2.5-Pro
- **Ollama**: Local models (phi3, mistral, llama3, etc.)

## 🎨 UI/UX Features

- **Dark Theme**: Modern dark interface
- **Responsive Design**: Works on desktop and mobile
- **Smooth Animations**: CSS transitions and hover effects
- **Code Highlighting**: Syntax highlighting for multiple languages
- **Message History**: Persistent chat history in sidebar
- **Loading States**: Beautiful loading animations

## 📱 Usage

1. **Select Model**: Choose your preferred AI model
2. **Enter API Key**: Provide your API key (or use environment variables)
3. **Choose Language**: Select the programming language for code generation
4. **Start Chatting**: Ask for code generation or programming help

## 🔒 Security Notes

This project is designed for CV/portfolio purposes. For production use, consider:
- API rate limiting
- Input validation
- Authentication
- API key encryption
- CORS configuration

## 📄 License

This project is for educational and portfolio purposes.

## 🤝 Contributing

Feel free to fork and submit pull requests for improvements.

## 📞 Support

For issues or questions, please create an issue in the repository.

