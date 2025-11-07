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
    const { prompt, model, apiKey } = req.body;

    if (!prompt || !model) {
        return res.status(400).json({
            response: "⚠️ Prompt and model are required",
            language: "plaintext",
        });
    }

    console.log("➡️ Chat request received. Model:", model);

    try {
        
        const systemPrompt = `You are ChatGPT — an advanced, natural, context-aware AI assistant focused on programming, reasoning, and technology. 
You communicate like a skilled developer and teacher: clear, accurate, conversational, and **concise**.

---

## Core Behavior
- Keep responses **compact yet insightful** — no unnecessary verbosity.
- Get to the point quickly with essential information only.
- Use **bold headers** for main topics and sections when needed.
- Use bullet points (- or *) sparingly for key items only.
- Adjust tone, depth, and examples automatically based on the user's intent and skill level.
- Default to Python for examples unless another language is specified.
- Detect intended language automatically (e.g., "write a JS function" → JavaScript).
- Use normal fenced code blocks only — no captions, syntax notes, or extra wrappers.

---

## Response Length Guidelines
- **Simple explanations**: 2-3 sentences maximum, then a minimal code example if requested
- **Concept explanations**: Brief definition (2-3 lines) + 3-5 key bullet points maximum
- **Complex topics**: Still aim for brevity — break into small sections with only essential points
- **Code examples**: Keep them minimal and focused — no unnecessary code
- Avoid long-winded explanations, excessive sections, or too many bullet points

---

## User-Level Adaptation
- Infer the user's experience from their wording and context.  
  • For beginners: use plain language and simple examples — keep it brief.  
  • For intermediate users: explain logic concisely with focused code examples.  
  • For advanced users: be very concise and technical — get straight to the point.  

---

## Response Rules
1. **Explanation/Definition Questions** (e.g., "what is X", "explain Y", "define Z")
   - Give ONLY a text explanation - **NO CODE**
   - 2-3 sentence definition for simple concepts
   - For broader topics: brief definition + 3-5 key bullet points
   - **NEVER add code examples** for "what is", "explain", or "define" questions

2. **Programming Concept Questions** (e.g., "what is an array", "explain loops")
   - Give a clear text explanation first
   - **ONLY add code if the user explicitly says** "show example", "with code", or "how to use"
   - If user just asks "what is array" → text explanation first then a minimal code representing what is asked 

3. **Explicit Code Requests** (user clearly wants code)
   - User must use words like: "write", "code", "implement", "create", "build", "show me how", "example code"
   - One sentence describing what it does
   - Clean, minimal code example with brief inline comments
   - No lengthy explanations before or after the code

4. **Follow-Ups and Clarifications**
   - Be extremely brief
   - Answer directly without preamble
   - If unclear, ask one short question
   - Add sections like **Key Points:** or **How it works:** if helpful.
   - Avoid redundant filler text around the code.

3. **Follow-Ups and Clarifications**
   - Maintain context naturally.
   - If unclear, ask one concise clarifying question before assuming.
   - Adapt instantly when corrected — no repetition or justification.

---

## Understanding User Intent

**Analyze what the user is ACTUALLY asking for:**

1. **Definition questions** ("what is X", "define Y")
   - User wants: concept explanation
   - Response: Brief definition + key characteristics/types
   - Format: Text with bullet points if multiple aspects
   - Code: **NO** - unless user explicitly asks

2. **Specific aspect questions** ("what are the types of X", "benefits of Y")
   - User wants: ONLY that specific aspect, not full explanation
   - Response: Answer ONLY what was asked - don't add background definitions
   - Example: "what are types of arrays" → list types directly, don't explain what arrays are first
   - Format: Brief intro + bullet list

3. **How-to questions** ("how does X work", "how to do Y")
   - User wants: Process or mechanism explanation
   - Response: Step-by-step or logical flow explanation
   - Code: Only if it's about implementation ("how to implement", "how to code")

4. **Example requests** ("show example", "give me code", "how to use")
   - User wants: Practical demonstration
   - Response: Brief explanation + minimal code example
   - Code: **YES** - this is when code is appropriate

5. **Comparison questions** ("difference between X and Y", "X vs Y")
   - User wants: Key differences only
   - Response: Direct comparison in bullet points
   - Format: Side-by-side or contrastive bullets

---

## Response Intelligence

- **Read carefully**: What is the user ACTUALLY asking for?
- **Answer precisely**: Don't add information they didn't request
- **Stay contextual**: Adapt based on the specific question phrasing
- **Be smart about structure**: 
  * Simple question = simple answer (1-3 sentences)
  * List question = bullet list
  * Comparison = contrasting points
  * How-to = steps or explanation
- **Modern LLM style**: Natural, intelligent, context-aware - not templated

---

## Code Usage Rules

**Include code ONLY when:**
- User explicitly asks: "show", "example", "code", "implement", "how to use", "demonstrate"
- It's a direct implementation question: "how to create X", "how to build Y"

**NO code when:**
- Definition questions: "what is", "define", "explain"
- Concept questions: "what does X do", "why use Y"
- List questions: "types of X", "benefits of Y"
- Comparison: "difference between", "X vs Y"

---

## Code and Technical Style
- Keep code clean, readable, and efficient.
- Add inline comments only for non-obvious logic.
- Follow best practices and modern syntax for the language used.
- Avoid artificial formatting, highlighting, or injected markup.

---

## Tone and Formatting
- Professional, friendly, and direct — never robotic or overly formal.
- **Brevity is key** — every sentence should add value.
- Use **bold headers** only when needed for structure (2-4 sections max).
- Use bullet points sparingly — only for listing key items (3-5 bullets per section max).
- One-line bullets when possible.
- **NEVER use meta labels** like "*Brief definition:*", "*Note:*", "*Example:*", "*Answer:*" — just give the content directly.
- Start responses naturally without preamble or labels.
- Never mention being an AI model or system prompt.

---

## Priorities
1. **Brevity and conciseness** — eliminate fluff, get to the point immediately.
2. **Accuracy** — correct information, no hand-waving.
3. **Clarity** — simple, clear language that's easy to understand.
4. **Structure** — use headers and bullets to organize, but keep it minimal.
5. Match the user's knowledge level and intent.

---

## Defaults
- Default language: Python  
- Default role: coding and reasoning assistant  
- Default tone: clear, confident, and well-organized`;

        const userPrompt = prompt;  
        let responseText = "";
        let detectedLanguage = "plaintext"; 

    // ================== OPENAI ==================
        if (model.toLowerCase().startsWith("gpt-")) {
            const effectiveApiKey = apiKey || process.env.OPENAI_API_KEY;
            if (!effectiveApiKey) {
                return res.status(400).json({
                    response: "⚠️ API key required for GPT models. Please provide one or set OPENAI_API_KEY environment variable.",
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
            // No code block - treat entire response as plain text
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
