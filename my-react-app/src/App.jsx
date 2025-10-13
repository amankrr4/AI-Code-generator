import { useState, useEffect, useRef } from "react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { db, auth, googleProvider } from './firebase';
import { 
  signInWithGoogle,
  signOutUser,
  createChatSession as createFirebaseChatSession,
  getUserSessions,
  deleteSession as deleteFirebaseSession,
  saveMessage as saveFirebaseMessage,
  getSessionMessages,
  saveApiKey as saveFirebaseApiKey,
  getApiKey as getFirebaseApiKey
} from './firebaseService';

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
  const [openMenuId, setOpenMenuId] = useState(null); // Track which three-dot menu is open
  const [user, setUser] = useState(null); // Firebase user
  const [authLoading, setAuthLoading] = useState(true); // Loading state for authentication

  const getApiUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    return import.meta.env.VITE_API_URL || 'https://your-railway-backend-url.railway.app';
  };
  
  // Load user's API keys from Firebase
  const loadApiKeys = async (userId) => {
    if (!userId) return;
    
    try {
      // Load OpenAI API key
      const openaiKey = await getFirebaseApiKey(userId, 'openai');
      if (openaiKey) {
        setApiKey(openaiKey);
      }
      
    } catch (error) {
      console.error("Error loading API keys:", error);
    }
  };

  const chatContainerRef = useRef(null);
  const chatScrollAreaRef = useRef(null);
  const selectorRef = useRef(null);
  const mainContentRef = useRef(null);
  const textareaRef = useRef(null);
  const languageDropdownRef = useRef(null);
  const abortControllerRef = useRef(null);

  const languages = ["Python", "JavaScript", "Java", "C++", "Ruby", "Go", "Rust", "TypeScript", "Swift", "Kotlin"];
  const models = ["gpt-4.1", "Claude", "Gemini-Flash", "Gemini-Pro", "Groq-GPT-OSS-20B", "Ollama-Local"];
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

  // Firebase authentication listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      
      if (currentUser) {
        // Load user's chat sessions from Firebase
        const loadUserSessions = async () => {
          try {
            const sessions = await getUserSessions(currentUser.uid);
            if (sessions && sessions.length > 0) {
              setChatSessions(sessions);
              
              // Set the current session to the most recent one
              const latestSession = sessions[0];
              setCurrentSessionId(latestSession.id);
              
              // Load messages for this session
              const sessionMessages = await getSessionMessages(latestSession.id);
              setMessages(sessionMessages || []);
              
              // Set chat bar position based on messages
              setChatBarPosition(sessionMessages && sessionMessages.length > 0 ? "bottom" : "center");
            }
            
            // Load user's API keys
            loadApiKeys(currentUser.uid);
          } catch (error) {
            console.error("Error loading user data:", error);
          }
        };
        
        loadUserSessions();
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Handle click outside components
  useEffect(() => {
    function handleClickOutside(e) {
      // Close any open chat session menu when clicking outside
      if (!e.target.closest('.menu-toggle-btn') && !e.target.closest('.session-menu')) {
        setOpenMenuId(null);
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

  // ✅ FIXED addMessage with Firebase integration
  const addMessage = async (content, type, language = null) => {
    const safeContent = content === null || content === undefined ? "" : String(content);
    const messageId = Date.now() + Math.random();
    
    const newMessage = {
      id: messageId,
      type,
      content: safeContent,
      language,
      timestamp: new Date().toISOString()
    };
    
    // Update UI immediately
    setMessages((prev) => [...prev, newMessage]);

    // If user is logged in, save message to Firebase
    if (user && currentSessionId) {
      try {
        // Save message to Firebase (role is either 'user' or 'assistant')
        const role = type === 'user' ? 'user' : 'assistant';
        await saveFirebaseMessage(currentSessionId, safeContent, role, language);
      } catch (error) {
        console.error("Error saving message to Firebase:", error);
      }
    }

    // Update local session state
    setChatSessions(prev => {
      const existingSessionIndex = prev.findIndex(s => s.id === currentSessionId);
      if (existingSessionIndex >= 0) {
        const updatedSession = {
          ...prev[existingSessionIndex],
          messages: [...prev[existingSessionIndex].messages, newMessage],
          // Don't update loading state here as it's managed separately
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
          // Initialize with not loading
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
      
      // Create a new AbortController for this request and store it in the ref
      // Cancel any previous request if it exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      try {
        const modelToUse = selectedModel === "Ollama-Local" ? selectedOllamaModel : selectedModel;
        const res = await fetch(`${getApiUrl()}/api/chat`, {
          method: "POST", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: inputValue, language: selectedLanguage, model: modelToUse,
            apiKey: selectedModel !== "Ollama-Local" ? apiKey : null,
          }),
          signal: abortControllerRef.current.signal, // Add abort signal to the fetch request
        });
        const data = await res.json();
        if (res.ok && data?.response) {
          // Ensure the language is always passed correctly, using selectedLanguage as fallback
          // And ensure it's not undefined or null
          const responseLanguage = data.language || selectedLanguage;
          console.log("Response language:", responseLanguage); // Debug the language
          addMessage(data.response, "assistant", responseLanguage);
        } else {
          addMessage(`⚠️ ${data.error || "Error contacting backend"}`, "assistant", "plaintext");
        }
      } catch (err) {
        console.error("Chat error:", err);
        
        // Don't show error message if the request was aborted (user clicked New Chat)
        if (err.name === 'AbortError') {
          console.log("Request was aborted");
          setLoading(false); // Ensure loading is turned off when aborting
          return; // Don't add any error message as this is intentional
        }
        
        let errorMessage = "⚠️ Error contacting backend";
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
          errorMessage = "⚠️ Network error - please check your internet connection";
        }
        addMessage(errorMessage, "assistant", "plaintext");
      } finally {
        // Always reset loading state when the request completes or fails
        // The abort case is handled separately in the catch block
        setLoading(false); // Hide loading indicator
      }
    }
  };

  const newChat = async () => {
    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null; // Clean up the reference
    }
    
    // Reset UI state
    setChatBarPosition("center"); // Reset chat bar position to center for new chat
    setLoading(false); // Reset loading state to ensure loader doesn't appear in new chat
    setMessages([]);
    
    // If user is logged in, create chat in Firebase
    if (user) {
      try {
        // Create a new chat session in Firebase
        const newChatData = await createFirebaseChatSession(user.uid, "New Chat");
        
        // Set the current session to the new one
        setCurrentSessionId(newChatData.id);
        
        // Add the new session to the UI
        setChatSessions(prev => [newChatData, ...prev]);
      } catch (error) {
        console.error("Error creating new chat:", error);
        // Fall back to local creation if Firebase fails
        localNewChat();
      }
    } else {
      // Not logged in, create chat locally
      localNewChat();
    }
  };
  
  // Create a new chat locally (when not logged in)
  const localNewChat = () => {
    // Create a new chat session with a new ID
    const newSessionId = Date.now();
    setCurrentSessionId(newSessionId);
    
    // Add the new empty session to chat sessions
    setChatSessions(prev => {
      const newSession = {
        id: newSessionId,
        title: "New Chat",
        timestamp: new Date().toISOString(),
        messages: [],
      };
      return [newSession, ...prev];
    });
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
  
  // Function to delete a chat session
  const deleteSession = async (sessionId, e) => {
    // Prevent the click from bubbling up to the parent (chat session)
    e.stopPropagation();
    
    // Close the menu
    setOpenMenuId(null);
    
    // If user is logged in, delete from Firebase
    if (user) {
      try {
        await deleteFirebaseSession(sessionId);
      } catch (error) {
        console.error("Error deleting session from Firebase:", error);
      }
    }
    
    // Filter out the session with the given ID (do this regardless of Firebase success)
    setChatSessions(prev => prev.filter(session => session.id !== sessionId));
    
    // If the deleted session was the current one, create a new chat
    if (sessionId === currentSessionId) {
      newChat();
    }
  };
  
  // Function to toggle the menu for a specific session
  const toggleMenu = (sessionId, e) => {
    // Prevent the click from bubbling up to the parent (chat session)
    e.stopPropagation();
    
    // Toggle the menu
    setOpenMenuId(openMenuId === sessionId ? null : sessionId);
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
        {/* User authentication section */}
        <div className="user-auth-section">
          {authLoading ? (
            <div className="auth-loading">Loading...</div>
          ) : user ? (
            <div className="user-profile">
              {user.photoURL && (
                <img src={user.photoURL} alt="Profile" className="user-avatar" />
              )}
              <div className="user-info">
                <div className="user-name">{user.displayName || user.email}</div>
                <button 
                  className="sign-out-btn" 
                  onClick={() => signOutUser()}
                  title="Sign Out"
                >
                  <span style={{ marginRight: '3px' }}>↪</span> Sign Out
                </button>
              </div>
            </div>
          ) : (
            <button 
              className="sign-in-btn" 
              onClick={() => signInWithGoogle().catch(err => console.log(err))}
            >
              <span className="google-icon">
                <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
              </span>
              <span>Sign in</span>
            </button>
          )}
        </div>
        
        <button className="new-chat-btn" onClick={newChat}>+ New Chat</button>
        <div className="chat-history">
          {chatSessions.map((session) => (
            <div 
              key={session.id} 
              className={`history-session ${session.id === currentSessionId ? 'active' : ''}`}
              onClick={() => {
                // Cancel any in-flight requests from the current session before switching
                if (abortControllerRef.current) {
                  abortControllerRef.current.abort();
                  abortControllerRef.current = null;
                }
                
                setCurrentSessionId(session.id);
                setMessages(session.messages);
                // Always reset loading state when switching chats
                setLoading(false);
                // Set chat bar position based on whether the session has messages
                setChatBarPosition(session.messages && session.messages.length > 0 ? "bottom" : "center");
              }}
            >
              <div className="session-title">{session.title}</div>
              <div className="session-actions">
                <button 
                  className="menu-toggle-btn"
                  onClick={(e) => toggleMenu(session.id, e)}
                >
                  •••
                </button>
                {openMenuId === session.id && (
                  <div className="session-menu">
                    <button 
                      className="delete-btn"
                      onClick={(e) => deleteSession(session.id, e)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
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
                <input 
                  type="password" 
                  placeholder="Enter API Key" 
                  className="api-input" 
                  value={apiKey} 
                  onChange={(e) => setApiKey(e.target.value)}
                  onBlur={() => {
                    // Save API key to Firebase when input loses focus (if user is logged in)
                    if (user && apiKey) {
                      saveFirebaseApiKey(user.uid, 'openai', apiKey)
                        .catch(err => console.error("Error saving API key:", err));
                    }
                  }}
                />
              </div>
            )}
            <button className="api-ok-btn mt-4" onClick={handleSave}>Save</button>
          </div>
        </div>

        <div className="chat-scroll-area" ref={chatScrollAreaRef} style={{ overflowY: 'auto', maxHeight: 'calc(100% - 80px)' }}>
          <div className="chat-container" ref={chatContainerRef} style={{ marginBottom: '0' }}>
            {messages.map((message) => {
              // Debug logging for message language
              console.log(`Message ID ${message.id} Type: ${message.type} Language: ${message.language}`);
              
              return (
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
                    showLineNumbers={false}
                  >
                    {message.content}
                  </SyntaxHighlighter>
                ) : (
                  message.content
                )}
              </div>
            );
            })}
            {/* Only show loader if loading state is true */}
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

