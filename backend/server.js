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

console.log(`🌍 Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
console.log(`🔗 Frontend URL: ${FRONTEND_URL}`);
console.log(`🤖 Ollama URL: ${OLLAMA_URL}`);

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
        return res.status(400).json({ response: "⚠️ Model is required", language: "plaintext" });
    }

    try {
        const response = await fetch(`${OLLAMA_URL}/api/show`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: model }),
        });

        if (response.status === 404) {
            return res.status(404).json({
                response: `⚠️ Model '${model}' not found`,
                language: "plaintext",
            });
        }
        if (!response.ok) {
            throw new Error(`Ollama not reachable (status ${response.status})`);
        }

        res.json({ response: "✅ Ollama model available", language: "plaintext" });
    } catch (error) {
        console.error("Ollama check failed:", error.message);
        res.status(500).json({
            response: `⚠️ Ollama check failed: ${error.message}`,
            language: "plaintext",
        });
    }
});

// ================== Chat Endpoint ==================
app.post("/api/chat", async (req, res) => {
    const { prompt, language = "Python", model, apiKey } = req.body;

    if (!prompt || !model) {
        return res.status(400).json({
            response: "⚠️ Prompt and model are required",
            language: "plaintext",
        });
    }

    console.log("➡️ Chat request received. Model:", model);

    try {
        const wrappedPrompt = `
You are an expert ${language} programmer.
Task: ${prompt}
Rules:
- Return ONLY a complete, runnable ${language} program.
- Must include function definition(s) AND a main/test block.
- No explanations, comments, or markdown fences.
- Remove \`\`\`${language}\`\`\` if present.                 
`.trim();

        let responseText = "";

        // ================== OPENAI ==================
        if (model.toLowerCase().startsWith("gpt-")) {
            const effectiveApiKey = apiKey || process.env.OPENAI_API_KEY;
            if (!effectiveApiKey) {
                return res.status(400).json({
                    response: "⚠️ API key required for GPT models. Please provide one or set OPENAI_API_KEY environment variable.",
                    language: "plaintext",
                });
            }

            let openaiModel = "gpt-3.5-turbo";
            if (model.toLowerCase().includes("4")) {
                openaiModel = "gpt-4o-mini";
            } else if (model.toLowerCase().includes("3.5")) {
                openaiModel = "gpt-3.5-turbo";
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
                        { role: "system", content: "You are a helpful AI assistant." },
                        { role: "user", content: wrappedPrompt },
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
                    response: "⚠️ API key required for Claude. Please provide one or set CLAUDE_API_KEY environment variable.",
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
                    messages: [{ role: "user", content: wrappedPrompt }],
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
                        contents: [{ parts: [{ text: wrappedPrompt }] }],
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

        // ================== OLLAMA ==================
        else {
            const response = await fetch(`${OLLAMA_URL}/api/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model,
                    prompt: wrappedPrompt,
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

        // Clean up response text (remove markdown fences if present)
        const cleanResponse = responseText
            .replace(/^```[\w]*\n?/g, '')
            .replace(/\n?```$/g, '')
            .trim();

        res.json({ response: cleanResponse, language });
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
            response: `⚠️ ${errorMessage}`,
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
    console.log(`🚀 Backend running on http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
    console.log(`🔗 Frontend URL: ${FRONTEND_URL}`);
    console.log(`🤖 Ollama URL: ${OLLAMA_URL}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
