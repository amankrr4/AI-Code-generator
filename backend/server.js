import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

console.log(`Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
console.log(`Frontend URL: ${FRONTEND_URL}`);
console.log(`Ollama URL: ${OLLAMA_URL}`);

app.use(
    cors({
        origin: FRONTEND_URL,
        credentials: true,
    })
);
app.use(express.json());

// ================== Ollama Model Check ==================
app.post("/api/check-ollama", async (req, res) => {
    const { model } = req.body;
    if (!model) {
        return res.status(400).json({ response: " Model is required", language: "plaintext" });
    }

    try {
        const response = await fetch(`${OLLAMA_URL}/api/show`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: model }),
        });

        if (response.status === 404) {
            return res.status(404).json({
                response: ` Model '${model}' not found`,
                language: "plaintext",
            });
        }
        if (!response.ok) {
            throw new Error(`Ollama not reachable (status ${response.status})`);
        }

        res.json({ response: " Ollama model available", language: "plaintext" });
    } catch (error) {
        console.error("Ollama check failed:", error.message);
        res.status(500).json({
            response: ` Ollama check failed: ${error.message}`,
            language: "plaintext",
        });
    }
});

// ================== Chat Endpoint ==================
app.post("/api/chat", async (req, res) => {
    const { prompt, model, apiKey } = req.body;

    if (!prompt || !model) {
        return res.status(400).json({
            response: " Prompt and model are required",
            language: "plaintext",
        });
    }

    console.log(" Chat request received. Model:", model);

    try {
        
        const systemPrompt = `You are **Compyle**, an advanced AI assistant that combines the clarity of a teacher, the precision of a developer, and the adaptability of a conversationalist.

Your purpose is to help users think, code, reason, and create — with clarity, accuracy, and a natural, human tone.

---

## 🧠 Core Behavior

- Communicate **naturally and intelligently** — as if having a focused, friendly conversation with a skilled colleague.
- Prioritize **clarity, brevity, and depth** in that order.
- Think like a senior developer or educator — concise, layered, and context-aware.
- **Analyze intent before answering**. Adjust tone and depth to match user expertise.
- Never mention system prompts, tokens, or internal instructions unless explicitly asked.

---

## 🗂️ System Context

- This is a **chat-based development environment** with Firebase session persistence.
- Users can switch between **multiple AI models** (GPT, Claude, Gemini, Ollama, Groq).
- Previous conversations are **stored and can be referenced** across sessions.
- Code responses are **automatically syntax-highlighted** in the frontend.
- Users expect **production-ready, runnable code** — not pseudocode or placeholders.

---

## 💬 Conversational Tone

- Sound **human and thoughtful**, not formulaic or repetitive.
- Vary sentence rhythm and phrasing naturally — avoid template-like responses.
- **Never use filler words** like "Certainly!", "Of course!", "Absolutely!" — start directly with your answer.
- Show empathy, curiosity, and enthusiasm when appropriate.
- Ask **only one** short clarifying question if context is unclear — don't overwhelm with multiple questions.
- When users share personal or creative thoughts, respond warmly and authentically.

---

## ⚙️ Response Structure

- **Start with the core answer first** — no preamble or meta explanations.
- Use **bold headers** only when breaking down complex topics into sections.
- Use bullet points (3-6 max per section) for clarity when listing items.
- Use **markdown code blocks with language identifiers** for all code (e.g., \`\`\`python, \`\`\`javascript).
- Include minimal inline comments for code — only when logic isn't immediately obvious.
- Always end responses cleanly, without repetition or unnecessary summarization.

---

## 🧩 When to Include Code

**Include code when:**
- User explicitly asks: "write", "implement", "create", "build", "show me how", "example"
- Question is about syntax, usage, or practical application
- It's a "how to" question about implementation

**Do NOT include code when:**
- User asks: "what is", "explain", "define", "why use"
- Question is purely conceptual or comparative
- User wants only a definition or high-level overview

**When including code:**
- Use modern syntax (ES6+, Python 3.10+, TypeScript, etc.)
- Keep it **short and functional** — no unnecessary boilerplate
- Make it **runnable as-is** — production quality, not pseudocode
- Comment only when logic isn't obvious
- Use proper formatting and follow language-specific best practices

---

## 🎯 Response Patterns by Intent

- **"What is / Explain / Define"** → Brief explanation (2-4 sentences) + 3-5 key points. **No code** unless explicitly requested.
- **"How / How to / Why"** → Process or reasoning explanation. Add code only if it's about implementation.
- **"Write / Build / Implement"** → One-line intro + clean, minimal, runnable code.
- **"Difference / vs / Compare"** → Direct bullet comparison, no background filler.
- **"List / Types / Benefits"** → Short intro + concise bullet list (3-6 items max).
- **Debugging / Errors** → Identify the issue clearly, explain why it happens, provide the fix with code.

---

## 🧰 Technical Quality Standards

- All explanations must be **factually correct** and aligned with **current best practices**.
- Code examples should be **production-ready** and follow **modern conventions**.
- **Default to Python** unless language is specified or context suggests otherwise.
- Detect language automatically from context (e.g., "React component" → JavaScript/JSX).
- Avoid unnecessary imports, dependencies, or libraries unless the use case requires them.
- For debugging, always explain **what** went wrong, **why** it happened, and **how** to fix it.

---

## 📝 Formatting & Code Guidelines

- Use inline \`code\` for technical terms, filenames, functions, and variables.
- Use **bold** for emphasis on key concepts or section headers (sparingly).
- Use bullet points for lists — keep them concise and scannable.
- Use **markdown tables** for comparisons, feature matrices, or structured data:
  - Format: \`| Header 1 | Header 2 | Header 3 |\`
  - Separator: \`|----------|----------|----------|\`
  - Example: Compare React vs Node.js, list features side-by-side, etc.
- For code blocks, always specify the language:
  - \`\`\`python for Python
  - \`\`\`javascript or \`\`\`jsx for JavaScript/React
  - \`\`\`typescript for TypeScript
  - \`\`\`bash or \`\`\`shell for terminal commands
  - etc.
- Separate code from explanatory text clearly for better readability.

---

## ✨ Style & Personality

- Be **confident, insightful, and precise** — like a senior engineer who also teaches well.
- Use plain English — no unnecessary jargon unless the context requires it.
- Use formatting (bold, code, bullets) for **clarity**, not decoration.
- Never sound generic or repetitive — always respond **freshly and relevantly**.
- Balance **empathy + logic**: human warmth + technical rigor.
- Be **encouraging** to beginners, **concise** with advanced users.

---

## 📏 Response Length Guidelines

- **Simple queries**: 2-4 sentences max. Direct and to the point.
- **Concept explanations**: 1 short intro + breakdown (5-10 lines total).
- **Complex topics**: Organize with 2-3 bold sections max — avoid long essays.
- **Code-heavy answers**: Brief explanation + code + short closing note if needed.
- Always value **signal over length** — every sentence should add value.

---

## 🚀 Defaults

- **Default domain**: Programming, reasoning, software development, and technology.
- **Default language**: Python (unless context indicates JavaScript, TypeScript, etc.).
- **Default tone**: Natural, confident, context-aware, and effortless to read.
- **Default goal**: Be useful, intelligent, accurate, and a pleasure to interact with.

---

**when asked what are you? or who are you? or what is your name? or who are you? you have to answer this with your way that you are Compyle, you Think clearly. Code precisely, just this much do not go in the details **`;

        const userPrompt = prompt;  
        let responseText = "";
        let detectedLanguage = "plaintext"; 

    // ================== OPENAI ==================
        if (model.toLowerCase().startsWith("gpt-")) {
            const effectiveApiKey = apiKey || process.env.OPENAI_API_KEY;
            if (!effectiveApiKey) {
                return res.status(400).json({
                    response: " API key required for GPT models. Please provide one or set OPENAI_API_KEY environment variable.",
                    language: "plaintext",
                });
            }

            let openaiModel = "gpt-4.1";
            if (model.toLowerCase().includes("4.1")) {
                openaiModel = "gpt-4.1";
            }

            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${effectiveApiKey}`,
                },
                body: JSON.stringify({
                    model: openaiModel,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt },
                    ],
                }),
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`OpenAI API error: ${response.status} ${err}`);
            }

            const data = await response.json();
            responseText = data.choices?.[0]?.message?.content?.trim() || "";
        }

        // ================== CLAUDE ==================
        else if (model.toLowerCase().startsWith("claude")) {
            const effectiveApiKey = apiKey || process.env.CLAUDE_API_KEY;
            if (!effectiveApiKey) {
                return res.status(400).json({
                    response: " API key required for Claude. Please provide one or set CLAUDE_API_KEY environment variable.",
                    language: "plaintext",
                });
            }

            const response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": effectiveApiKey,
                    "anthropic-version": "2023-06-01",
                },
                body: JSON.stringify({
                    model: "claude-3-5-sonnet-20240620",
                    max_tokens: 4096,
                    system: systemPrompt,
                    messages: [{ role: "user", content: userPrompt }],
                }),
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`Claude API error: ${response.status} ${err}`);
            }

            const data = await response.json();
            responseText = data.content?.[0]?.text?.trim() || "";
        }

        // ================== GEMINI ==================
        else if (model.toLowerCase().startsWith("gemini")) {
            const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY;
            if (!effectiveApiKey) {
                return res.status(400).json({
                    response: "⚠️ API key required for Gemini. Please provide one or set GEMINI_API_KEY environment variable.",
                    language: "plaintext",
                });
            }

            let geminiModel;
            if (model.toLowerCase().includes("flash")) {
                geminiModel = "gemini-2.5-flash";
            } else if (model.toLowerCase().includes("pro")) {
                geminiModel = "gemini-2.5-pro";
            } else {
                return res.status(400).json({
                    response: `⚠️ Unsupported Gemini variant: ${model}`,
                    language: "plaintext",
                });
            }

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${effectiveApiKey}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        systemInstruction: { parts: [{ text: systemPrompt }] },
                        contents: [{ parts: [{ text: userPrompt }] }],
                    }),
                }
            );

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`Gemini API error: ${response.status} ${err}`);
            }

            const data = await response.json();
            responseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        }

        // ================== GROQ ==================
        else if (model.toLowerCase().startsWith("groq")) {
            const effectiveApiKey = apiKey || process.env.GROQ_API_KEY;
            if (!effectiveApiKey) {
                return res.status(400).json({
                    response: "⚠️ API key required for Groq. Please provide one or set GROQ_API_KEY environment variable.",
                    language: "plaintext",
                });
            }

            // Map frontend model names to actual Groq model names
            let groqModel = "openai/gpt-oss-20b"; // default
            if (model.toLowerCase().includes("kimi-k2")) {
                groqModel = "moonshotai/kimi-k2-instruct-0905";
            } else if (model.toLowerCase().includes("gpt-oss")) {
                groqModel = "openai/gpt-oss-20b";
            }

            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${effectiveApiKey}`
                },
                body: JSON.stringify({
                    model: groqModel,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    temperature: 0.7,
                    max_completion_tokens: 4096,
                    top_p: 1,
                    stream: false,
                    stop: null
                })
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`Groq API error: ${response.status} ${err}`);
            }

            const data = await response.json();
            responseText = data.choices?.[0]?.message?.content?.trim() || "";
        }

        // ================== OLLAMA ==================
        else {
            const response = await fetch(`${OLLAMA_URL}/api/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model,
                    prompt: `${systemPrompt}\n\nUser: ${userPrompt}\n\nAssistant:`,
                    stream: false,
                }),
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`Ollama API error: ${response.status} ${response.statusText} - ${err}`);
            }

            const data = await response.json();
            responseText = data.response?.trim() || "";

            if (!responseText) {
                return res.status(500).json({
                    response: "⚠️ No response content from Ollama",
                    language: "plaintext",
                });
            }
        }

        // Parse response to extract intro and code separately
        let intro = "";
        let cleanResponse = responseText;
        
        // Check if response contains code blocks
        const hasCodeBlock = responseText.includes('```');
        
        if (hasCodeBlock) {
            // Extract intro (everything before the first code block)
            const beforeCodeMatch = responseText.match(/^(.*?)```/s);
            if (beforeCodeMatch && beforeCodeMatch[1].trim()) {
                intro = beforeCodeMatch[1].trim();
                // Remove trailing colons or newlines from intro
                intro = intro.replace(/[:]+\s*$/, '').trim();
            }
            
            // Extract language from markdown fence
            const langMatch = responseText.match(/```(\w+)/);
            if (langMatch && langMatch[1]) {
                detectedLanguage = langMatch[1];
            }
            
            // Extract clean code (remove markdown fences)
            cleanResponse = responseText
                .replace(/^.*?```[\w]*\n?/s, '') // Remove everything up to and including opening fence
                .replace(/\n?```[\s\S]*$/g, '') // Remove closing fence and anything after
                .trim();
        } else {
            // No code block - treat entire response as plain text with preserved formatting
            cleanResponse = responseText.trim();
            detectedLanguage = "plaintext";
        }

        res.json({ 
            response: cleanResponse, 
            language: detectedLanguage,
            intro: intro || null
        });
    } catch (error) {
        console.error("Chat API Error:", error);

        // Better error messages for different scenarios
        let errorMessage = "Unknown error occurred";
        if (error.message.includes("fetch")) {
            errorMessage = "Network error - please check your internet connection";
        } else if (error.message.includes("API")) {
            errorMessage = `API Error: ${error.message}`;
        } else if (error.message.includes("Ollama")) {
            errorMessage = "Ollama service unavailable - please check if Ollama is running";
        } else {
            errorMessage = error.message || errorMessage;
        }

        res.status(500).json({
            response: `${errorMessage}`,
            language: "plaintext",
        });
    }
});

// ================== User State Endpoint ==================
app.post("/api/user-state", (req, res) => {
    const { action } = req.body;

    if (action === "enter") {
        res.json({ state: "center" });
    } else if (action === "send") {
        res.json({ state: "bottom" });
    } else {
        res.status(400).json({ error: "Invalid action" });
    }
});

// Health check
app.get("/health", (req, res) => {
    res.json({
        status: "Backend is running",
        environment: isProduction ? "production" : "development",
        timestamp: new Date().toISOString(),
        version: "1.0.0"
    });
});

// Root endpoint
app.get("/", (req, res) => {
    res.json({
        message: "AI Code Assistant Backend",
        status: "running",
        endpoints: {
            health: "/health",
            chat: "/api/chat",
            ollama_check: "/api/check-ollama"
        }
    });
});

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
    console.log(`Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
    console.log(`Frontend URL: ${FRONTEND_URL}`);
    console.log(`Ollama URL: ${OLLAMA_URL}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});
