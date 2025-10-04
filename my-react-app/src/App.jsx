import { useState, useEffect, useRef } from "react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

// Style object for the 'okaidia' theme, modified to be transparent and have a smaller font size
const okaidiaStyle = {
  'code[class*="language-"]': {
    color: '#f8f8f2',
    background: 'none',
    textShadow: '0 1px rgba(0, 0, 0, 0.3)',
    fontFamily: "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
    fontSize: '14px',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.4',
    MozTabSize: '4',
    OTabSize: '4',
    tabSize: '4',
    WebkitHyphens: 'none',
    MozHyphens: 'none',
    msHyphens: 'none',
    hyphens: 'none'
  },
  'pre[class*="language-"]': {
    color: '#f8f8f2',
    background: 'transparent',
    textShadow: '0 1px rgba(0, 0, 0, 0.3)',
    fontFamily: "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
    fontSize: '14px',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.4',
    MozTabSize: '4',
    OTabSize: '4',
    tabSize: '4',
    WebkitHyphens: 'none',
    MozHyphens: 'none',
    msHyphens: 'none',
    hyphens: 'none',
    padding: '0',
    margin: '0',
    overflow: 'auto'
  },
  ':not(pre) > code[class*="language-"]': {
    background: '#272822',
    padding: '.1em',
    borderRadius: '.3em',
    whiteSpace: 'normal'
  },
  'comment': { color: '#8292a2' },
  'prolog': { color: '#8292a2' },
  'doctype': { color: '#8292a2' },
  'cdata': { color: '#8292a2' },
  'punctuation': { color: '#f8f8f2' },
  'namespace': { Opacity: '.7' },
  'property': { color: '#f92672' },
  'tag': { color: '#f92672' },
  'constant': { color: '#f92672' },
  'symbol': { color: '#f92672' },
  'deleted': { color: '#f92672' },
  'boolean': { color: '#ae81ff' },
  'number': { color: '#ae81ff' },
  'selector': { color: '#a6e22e' },
  'attr-name': { color: '#a6e22e' },
  'string': { color: '#a6e22e' },
  'char': { color: '#a6e22e' },
  'builtin': { color: '#a6e22e' },
  'inserted': { color: '#a6e22e' },
  'operator': { color: '#f8f8f2' },
  'entity': { color: '#f8f8f2', cursor: 'help' },
  'url': { color: '#f8f8f2' },
  '.language-css .token.string': { color: '#f8f8f2' },
  '.style .token.string': { color: '#f8f8f2' },
  'variable': { color: '#f8f8f2' },
  'atrule': { color: '#e6db74' },
  'attr-value': { color: '#e6db74' },
  'function': { color: '#e6db74' },
  'class-name': { color: '#e6db74' },
  'keyword': { color: '#66d9ef' },
  'regex': { color: '#fd971f' },
  'important': { color: '#fd971f', fontWeight: 'bold' },
  'bold': { fontWeight: 'bold' },
  'italic': { fontStyle: 'italic' }
};

function ChatInterface() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatSessions, setChatSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(Date.now());
  const [inputValue, setInputValue] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("Python");
  const [copiedMessageId, setCopiedMessageId] = useState(null);

  const handleCopy = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(content);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const [selectedModel, setSelectedModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showSelector, setShowSelector] = useState(false);
  const [showModelOptions, setShowModelOptions] = useState(false);
  const [hasModelOptionsOpened, setHasModelOptionsOpened] = useState(false);
  const [selectedOllamaModel, setSelectedOllamaModel] = useState("");
  const [showOllamaOptions, setShowOllamaOptions] = useState(false);
  const [hasOllamaOptionsOpened, setHasOllamaOptionsOpened] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const [showLanguageOptions, setShowLanguageOptions] = useState(false);
  const [hasLanguageOptionsOpened, setHasLanguageOptionsOpened] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chatBarPosition, setChatBarPosition] = useState("center");

  const getApiUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    return import.meta.env.VITE_API_URL || 'https://your-railway-backend-url.railway.app';
  };

  const chatContainerRef = useRef(null);
  const chatScrollAreaRef = useRef(null);
  const selectorRef = useRef(null);
  const mainContentRef = useRef(null);
  const textareaRef = useRef(null);
  const languageDropdownRef = useRef(null);

  const languages = ["Python", "JavaScript", "Java", "C++", "Ruby", "Go", "Rust", "TypeScript", "Swift", "Kotlin"];
  const models = ["gpt-4", "gpt-3.5-turbo", "Claude", "Gemini-Flash", "Gemini-Pro", "Ollama-Local"];
  const ollamaModels = [
    "phi3:3.8b", "mistral:7b", "llama3:8b", "gemma:2b", "gemma3:4b",
    "gemma:7b", "codegemma:2b", "codegemma:7b", "starcoder2:3b", "deepseek-coder:6.7b",
  ];

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      requestAnimationFrame(() => {
        textarea.style.height = `${textarea.scrollHeight}px`;
      });
    }
  }, [inputValue]);

  useEffect(() => {
    if (chatScrollAreaRef.current) {
      chatScrollAreaRef.current.scrollTop = chatScrollAreaRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    const handleHover = (e) => {
      if (e.clientX <= 10) setSidebarOpen(true);
      else if (sidebarOpen && e.clientX > 240) setSidebarOpen(false);
    };
    window.addEventListener("mousemove", handleHover);
    return () => window.removeEventListener("mousemove", handleHover);
  }, [sidebarOpen]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (selectorRef.current && !selectorRef.current.contains(e.target)) {
        setShowSelector(false);
        setShowModelOptions(false);
        setShowOllamaOptions(false);
      }
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(e.target)) {
        setShowLanguageOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showModelOptions) {
      const timer = setTimeout(() => setHasModelOptionsOpened(true), 10);
      return () => clearTimeout(timer);
    } else setHasModelOptionsOpened(false);
  }, [showModelOptions]);

  useEffect(() => {
    if (showOllamaOptions) {
      const timer = setTimeout(() => setHasOllamaOptionsOpened(true), 10);
      return () => clearTimeout(timer);
    } else setHasOllamaOptionsOpened(false);
  }, [showOllamaOptions]);

  useEffect(() => {
    if (showLanguageOptions) {
      const timer = setTimeout(() => setHasLanguageOptionsOpened(true), 10);
      return () => clearTimeout(timer);
    } else setHasLanguageOptionsOpened(false);
  }, [showLanguageOptions]);

  useEffect(() => {
    if (selectedModel !== "Ollama-Local") {
      setApiKey("");
    }
  }, [selectedModel]);

  // ✅ FIXED addMessage (everything else untouched)
  const addMessage = (content, type, language = null) => {
    const safeContent = content === null || content === undefined ? "" : String(content);
    const newMessage = {
      id: Date.now() + Math.random(),
      type,
      content: safeContent,
      language,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, newMessage]);

    // Save both user + assistant messages
    setChatSessions(prev => {
      const existingSessionIndex = prev.findIndex(s => s.id === currentSessionId);
      if (existingSessionIndex >= 0) {
        const updatedSession = {
          ...prev[existingSessionIndex],
          messages: [...prev[existingSessionIndex].messages, newMessage],
        };
        if (type === "user" && !updatedSession.title) {
          updatedSession.title = safeContent;
        }
        const newSessions = [...prev];
        newSessions[existingSessionIndex] = updatedSession;
        return newSessions;
      } else {
        const newSession = {
          id: currentSessionId,
          title: type === "user" ? safeContent : "New Chat",
          timestamp: new Date().toISOString(),
          messages: [newMessage],
        };
        return [newSession, ...prev];
      }
    });
  };

  const checkOllamaConnection = async (model) => {
    setOllamaStatus("checking");
    try {
      const res = await fetch(`${getApiUrl()}/api/check-ollama`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model }),
      });
      const data = await res.json();
      if (res.ok && data?.response && !String(data.response).toLowerCase().startsWith("⚠️")) {
        setOllamaStatus("connected");
      } else {
        setOllamaStatus("error");
      }
    } catch (err) {
      console.error("Ollama check error:", err);
      setOllamaStatus("error");
    }
  };

  const sendMessage = async () => {
    if (inputValue.trim()) {
      setChatBarPosition("bottom");
      addMessage(inputValue, "user"); // Add user message immediately
      setInputValue(""); // Clear input field
      setLoading(true); // Show loading indicator
      try {
        const modelToUse = selectedModel === "Ollama-Local" ? selectedOllamaModel : selectedModel;
        const res = await fetch(`${getApiUrl()}/api/chat`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: inputValue, language: selectedLanguage, model: modelToUse,
            apiKey: selectedModel !== "Ollama-Local" ? apiKey : null,
          }),
        });
        const data = await res.json();
        if (res.ok && data?.response) {
          addMessage(data.response, "assistant", data.language || "plaintext");
        } else {
          addMessage(`⚠️ ${data.error || "Error contacting backend"}`, "assistant", "plaintext");
        }
      } catch (err) {
        console.error("Chat error:", err);
        let errorMessage = "⚠️ Error contacting backend";
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
          errorMessage = "⚠️ Network error - please check your internet connection";
        }
        addMessage(errorMessage, "assistant", "plaintext");
      } finally {
        setLoading(false); // Hide loading indicator
      }
    }
  };

  const newChat = () => {
    setMessages([]);
    setCurrentSessionId(Date.now());
    setChatBarPosition("center"); // Reset chat bar position to center for new chat
  };

  const handleSave = () => {
    if (selectedModel === "Ollama-Local") {
      if (!selectedOllamaModel) {
        alert("Please select an Ollama model");
        return;
      }
      checkOllamaConnection(selectedOllamaModel);
    } else {
      if (!selectedModel || !apiKey.trim()) {
        alert("Please select a model and enter an API key");
        return;
      }
    }
    setShowSelector(false);
  };

  useEffect(() => {
    const handleInteraction = (e) => {
      if (chatBarPosition === "center" && e.target.classList.contains("send-btn")) {
        setChatBarPosition("bottom");
      }
    };

    document.addEventListener("click", handleInteraction);
    return () => document.removeEventListener("click", handleInteraction);
  }, [chatBarPosition]);

  return (
    <div className="app-container">
      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <button className="new-chat-btn" onClick={newChat}>+ New Chat</button>
        <div className="chat-history">
          {chatSessions.map((session) => (
            <div 
              key={session.id} 
              className={`history-session ${session.id === currentSessionId ? 'active' : ''}`}
              onClick={() => {
                setCurrentSessionId(session.id);
                setMessages(session.messages);
                // Set chat bar position based on whether the session has messages
                setChatBarPosition(session.messages && session.messages.length > 0 ? "bottom" : "center");
              }}
            >
              <div className="session-title">{session.title}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={`main-content ${sidebarOpen ? "sidebar-open" : ""}`} ref={mainContentRef}>
        <div className="model-selector-wrapper" ref={selectorRef}>
          <button className="model-selector-btn" onClick={() => setShowSelector((prev) => !prev)}>
            ⚙ {selectedModel ? `Model: ${selectedModel}` : "Select Model"}
          </button>
          <div className={`model-selector-panel ${showSelector ? "open" : ""}`}>
            <label className="block mb-2 text-sm">Choose a Model</label>
            <div className="custom-model-dropdown">
              <div className="selected-model" onClick={() => setShowModelOptions(!showModelOptions)}>
                {selectedModel || "-- Select a Model --"}
              </div>
              {showModelOptions && (
                <ul className={`model-options-list ${hasModelOptionsOpened ? "list-open" : ""}`}>
                  {models.map((m) => (
                    <li key={m} className="model-option" onClick={() => {
                      setSelectedModel(m);
                      setShowModelOptions(false);
                      if (m !== "Ollama-Local") setOllamaStatus(null);
                    }}>{m}</li>
                  ))}
                </ul>
              )}
            </div>
            {selectedModel === "Ollama-Local" && (
              <div className="mt-4">
                <label className="block mb-2 text-sm">Choose an Ollama Model</label>
                <div className="ollama-models-dropdown">
                  <div className="selected-model" onClick={() => setShowOllamaOptions(!showOllamaOptions)}>
                    {selectedOllamaModel || "-- Select Ollama Model --"}
                  </div>
                  {showOllamaOptions && (
                    <ul className={`ollama-options-list ${hasOllamaOptionsOpened ? "list-open" : ""}`}>
                      {ollamaModels.map((m) => (
                        <li key={m} className="ollama-option" onClick={() => {
                          setSelectedOllamaModel(m);
                          setShowOllamaOptions(false);
                          checkOllamaConnection(m);
                        }}>{m}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="mt-3">
                  {ollamaStatus === null && <p className="text-gray-400 text-sm"><h5>ℹ️ Select a model to check its status.</h5></p>}
                  {ollamaStatus === "checking" && <p className="text-yellow-400 text-sm"><h5>🔄 Checking Ollama connection...</h5></p>}
                  {ollamaStatus === "connected" && <p className="text-green-400 text-sm"><h5>✅ Ollama is running and ready</h5></p>}
                  {ollamaStatus === "error" && <p className="text-red-400 text-sm"><h5>❌ Ollama not detected or wrong model</h5></p>}
                </div>
              </div>
            )}
            {selectedModel && selectedModel !== "Ollama-Local" && (
              <div className="mt-4">
                <label className="block mb-2 text-sm">Enter API Key</label>
                <input type="password" placeholder="Enter API Key" className="api-input" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
              </div>
            )}
            <button className="api-ok-btn mt-4" onClick={handleSave}>Save</button>
          </div>
        </div>

        <div className="chat-scroll-area" ref={chatScrollAreaRef} style={{ overflowY: 'auto', maxHeight: 'calc(100% - 80px)' }}>
          <div className="chat-container" ref={chatContainerRef} style={{ marginBottom: '0' }}>
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.type}`}>
                {message.type === "assistant" && (
                  <button 
                    className={`copy-btn ${copiedMessageId === message.content ? 'copied' : ''}`}
                    onClick={() => handleCopy(message.content)}
                  >
                    {copiedMessageId === message.content ? '✓ Copied' : 'Copy'}
                  </button>
                )}
                {message.type === "assistant" && message.language && message.language !== "plaintext" ? (
                  <SyntaxHighlighter
                    language={message.language.toLowerCase()}
                    style={okaidiaStyle}
                    wrapLongLines={true}
                  >
                    {message.content}
                  </SyntaxHighlighter>
                ) : (
                  message.content
                )}
              </div>
            ))}
            {loading && (
              <div className="loader">
                <div className="circle"><div className="dot"></div><div className="outline"></div></div>
                <div className="circle"><div className="dot"></div><div className="outline"></div></div>
                <div className="circle"><div className="dot"></div><div className="outline"></div></div>
                <div className="circle"><div className="dot"></div><div className="outline"></div></div>
              </div>
            )}
          </div>
        </div>

        <div className={`input-container chat-bar ${chatBarPosition === "center" ? "center" : "bottom"}`} style={{ border: 'none', boxShadow: 'none' }}>
          <div className="input-wrapper">
            <textarea
              ref={textareaRef} rows={1} className="message-input" placeholder="Ask anything..."
              value={inputValue} onChange={(e) => setInputValue(e.target.value.replace(/^\n/, ""))}
            />
            <div className="language-dropdown-wrapper" ref={languageDropdownRef}>
              <div className="language-dropdown-selected" onClick={() => setShowLanguageOptions(!showLanguageOptions)}>
                {selectedLanguage}
              </div>
              {showLanguageOptions && (
                <ul className={`language-options-list ${hasLanguageOptionsOpened ? "list-open" : ""}`}>
                  {languages.map((lang) => (
                    <li key={lang} className="language-option" onClick={() => {
                      setSelectedLanguage(lang);
                      setShowLanguageOptions(false);
                    }}>{lang}</li>
                  ))}
                </ul>
              )}
            </div>
            <button className={`send-btn ${inputValue.trim() ? "active" : ""}`} onClick={sendMessage} disabled={!inputValue.trim()}>➤</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;

