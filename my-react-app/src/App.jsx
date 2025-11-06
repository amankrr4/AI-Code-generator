import { useState, useEffect, useRef } from "react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { db, auth, googleProvider } from './firebase';
// Import directly from firebaseService
import { 
  signInWithGoogle,
  signOutUser,
  createChatSession as createFirebaseChatSession,
  getUserSessions,
  deleteSession as deleteFirebaseSession,
  saveMessage as saveFirebaseMessage,
  getSessionMessages,
  saveApiKey as saveFirebaseApiKey,
  getApiKey as getFirebaseApiKey,
  updateSessionTitle as updateFirebaseSessionTitle
} from './firebaseService';

// Import the debug function from firebaseAuth
import { debugFirebaseConfig } from './firebaseAuth';

// Style object for VS Code's default dark theme syntax highlighting
const okaidiaStyle = {
  'code[class*="language-"]': {
    color: '#d4d4d4', // VS Code default text color
    background: 'none',
    fontFamily: "'Cascadia Code', Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace", // VS Code default font
    fontSize: '14px',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.5',
    MozTabSize: '4',
    OTabSize: '4',
    tabSize: '4',
    WebkitHyphens: 'none',
    MozHyphens: 'none',
    msHyphens: 'none',
    hyphens: 'none'
  },
  'pre[class*="language-"]': {
    color: '#d4d4d4', // VS Code default text color
    background: '#1e1e1e', // VS Code default background
    fontFamily: "'Cascadia Code', Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace", // VS Code default font
    fontSize: '14px',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.5',
    MozTabSize: '4',
    OTabSize: '4',
    tabSize: '4',
    WebkitHyphens: 'none',
    MozHyphens: 'none',
    msHyphens: 'none',
    hyphens: 'none',
    padding: '1em',
    margin: '0',
    overflow: 'auto',
    borderRadius: '6px'
  },
  ':not(pre) > code[class*="language-"]': {
    background: '#1e1e1e',
    padding: '.1em',
    borderRadius: '.3em',
    whiteSpace: 'normal'
  },
  // VS Code default dark theme token colors
  'comment': { color: '#6A9955' }, // Green comments
  'prolog': { color: '#6A9955' },
  'doctype': { color: '#6A9955' },
  'cdata': { color: '#6A9955' },
  'punctuation': { color: '#d4d4d4' }, // Light gray
  'namespace': { opacity: '.7' },
  'property': { color: '#9CDCFE' }, // Light blue
  'tag': { color: '#569CD6' }, // Blue
  'constant': { color: '#4FC1FF' }, // Bright blue
  'symbol': { color: '#4FC1FF' },
  'deleted': { color: '#CE9178' }, // Orange-ish
  'boolean': { color: '#569CD6' }, // Blue
  'number': { color: '#B5CEA8' }, // Light green
  'selector': { color: '#D7BA7D' }, // Light brown
  'attr-name': { color: '#9CDCFE' }, // Light blue
  'string': { color: '#CE9178' }, // Orange-ish
  'char': { color: '#CE9178' },
  'builtin': { color: '#DCDCAA' }, // Yellow-ish
  'inserted': { color: '#b5cea8' },
  'operator': { color: '#d4d4d4' }, // Default text
  'entity': { color: '#4EC9B0', cursor: 'help' }, // Teal
  'url': { color: '#d4d4d4' },
  '.language-css .token.string': { color: '#CE9178' },
  '.style .token.string': { color: '#CE9178' },
  'variable': { color: '#9CDCFE' }, // Light blue
  'atrule': { color: '#C586C0' }, // Purple
  'attr-value': { color: '#CE9178' }, // Orange-ish
  'function': { color: '#DCDCAA' }, // Yellow function names
  'class-name': { color: '#4EC9B0' }, // Teal class names
  'keyword': { color: '#569CD6' }, // Blue keywords
  'regex': { color: '#D16969' }, // Red-ish
  'important': { color: '#569CD6', fontWeight: 'bold' },
  'bold': { fontWeight: 'bold' },
  'italic': { fontStyle: 'italic' }
};

// Simple typewriter component that displays full content with CSS animation
function TypewriterText({ content, isCode = false, language = 'javascript', intro = null }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay to trigger the animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [content]);

  const containerStyle = {
    opacity: isVisible ? 1 : 0,
    animation: isVisible ? 'typewriterSlideIn 0.8s ease-out' : 'none',
    fontFamily: isCode ? "'Cascadia Code', 'Fira Code', Consolas, Monaco, monospace" : 'inherit',
    fontSize: isCode ? '14px' : 'inherit',
    lineHeight: isCode ? '1.6' : 'inherit',
    padding: isCode ? '16px' : '0',
    color: isCode ? '#d4d4d4' : 'inherit',
    whiteSpace: 'pre-wrap'
  };

  if (isCode && language && language !== 'plaintext') {
    return (
      <div className="vs-code-container">
        <div style={containerStyle}>
        {content.split('\n').map((line, index) => (
          <div 
            key={index}
            style={{
              opacity: 0,
              animation: `fadeInLine 0.5s ease-out ${index * 0.3}s forwards`,
              display: 'flex'
            }}
          >
            <span style={{ 
              color: '#858585', 
              marginRight: '16px',
              minWidth: '20px',
              textAlign: 'right'
            }}>
                {index + 1}
              </span>
              <span>{line}</span>
            </div>
          ))}
        </div>
         </div>
    );
  }

  return (
    <div style={containerStyle}>
      {content.split('\n').map((line, index) => (
        <div 
          key={index}
          style={{
            opacity: 0,
            animation: `fadeInLine 0.4s ease-out ${index * 0.15}s forwards`
          }}
        >
          {line}
        </div>
      ))}
    </div>
  );
}

// Word-by-word typewriter component for intro text (ChatGPT-like effect)
function WordTypewriter({ text }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  
  useEffect(() => {
    if (!text) return;
    
    setDisplayedText(''); // Reset on text change
    setIsComplete(false);
    startTimeRef.current = null;
    
    const charsPerSecond = 35; // Adjust this for speed (higher = faster)
    
    const animate = (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }
      
      const elapsed = timestamp - startTimeRef.current;
      const charsToShow = Math.floor((elapsed / 1000) * charsPerSecond);
      
      if (charsToShow < text.length) {
        setDisplayedText(text.slice(0, charsToShow + 1));
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayedText(text);
        setIsComplete(true);
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [text]);
  
  // Always show displayedText to avoid jumps
  return <span>{displayedText}</span>;
}

// Simple Markdown renderer for plaintext responses
function MarkdownText({ text }) {
  const renderText = (content) => {
    // Split by lines to handle bullets and paragraphs
    const lines = content.split('\n');
    const elements = [];
    let currentParagraph = [];
    
    lines.forEach((line, index) => {
      // Handle bullet points (-, *, •)
      if (line.trim().match(/^[-*•]\s+/)) {
        // Close any open paragraph
        if (currentParagraph.length > 0) {
          elements.push(
            <p key={`p-${index}`} style={{ marginBottom: '8px' }}>
              {parseBoldText(currentParagraph.join(' '))}
            </p>
          );
          currentParagraph = [];
        }
        
        // Add bullet point
        const bulletContent = line.trim().replace(/^[-*•]\s+/, '');
        elements.push(
          <div key={`bullet-${index}`} style={{ 
            display: 'flex', 
            marginLeft: '20px', 
            marginBottom: '4px',
            alignItems: 'flex-start'
          }}>
            <span style={{ marginRight: '8px', minWidth: '8px' }}>•</span>
            <span>{parseBoldText(bulletContent)}</span>
          </div>
        );
      } else if (line.trim() === '') {
        // Empty line - close paragraph if open
        if (currentParagraph.length > 0) {
          elements.push(
            <p key={`p-${index}`} style={{ marginBottom: '12px' }}>
              {parseBoldText(currentParagraph.join(' '))}
            </p>
          );
          currentParagraph = [];
        }
      } else {
        // Regular line - add to current paragraph
        currentParagraph.push(line.trim());
      }
    });
    
    // Close any remaining paragraph
    if (currentParagraph.length > 0) {
      elements.push(
        <p key={`p-final`} style={{ marginBottom: '8px' }}>
          {parseBoldText(currentParagraph.join(' '))}
        </p>
      );
    }
    
    return elements;
  };
  
  // Parse **bold** text
  const parseBoldText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };
  
  return <div>{renderText(text)}</div>;
}

// Word-by-word typewriter with markdown support
function WordTypewriterMarkdown({ text }) {
  const [displayedText, setDisplayedText] = useState('');
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  
  useEffect(() => {
    if (!text) return;
    
    setDisplayedText('');
    startTimeRef.current = null;
    
    const charsPerSecond = 35;
    
    const animate = (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }
      
      const elapsed = timestamp - startTimeRef.current;
      const charsToShow = Math.floor((elapsed / 1000) * charsPerSecond);
      
      if (charsToShow < text.length) {
        setDisplayedText(text.slice(0, charsToShow + 1));
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayedText(text);
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [text]);
  
  return <MarkdownText text={displayedText} />;
}

// Language mapping for Prism.js compatibility
const mapLanguageForSyntaxHighlighter = (language) => {
  const languageMap = {
    'c++': 'cpp',
    'c#': 'csharp',
    'objective-c': 'objectivec',
    'shell': 'bash',
    'sh': 'bash'
  };
  
  if (!language) return 'javascript';
  const lowerLang = language.toLowerCase();
  return languageMap[lowerLang] || lowerLang;
};
 
function ChatInterface() {

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  
  // Don't initialize from localStorage - let Firebase handle session state
  const [chatSessions, setChatSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(Date.now());
  const [inputValue, setInputValue] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState(null);

  const handleCopy = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(content);
      
      // Set focus to activate the button's :focus-visible state
      document.activeElement.blur();
      document.querySelector(`.copy[data-content="${content}"]`)?.focus();
      
      setTimeout(() => {
        setCopiedMessageId(null);
        document.querySelector(`.copy[data-content="${content}"]`)?.blur();
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const [selectedModel, setSelectedModel] = useState(() => {
    // Load selected model from localStorage on initial load
    return localStorage.getItem('selectedModel') || "";
  });
  const [apiKey, 
    setApiKey] = useState(() => {
    // Load API key from localStorage on initial load
    const savedApiKey = localStorage.getItem('apiKey') || "";
    console.log("Initial API key load from localStorage:", savedApiKey ? "Key found" : "No key found");
    return savedApiKey;
  });
  const [showSelector, setShowSelector] = useState(false);
  const [showModelOptions, setShowModelOptions] = useState(false);
  const [hasModelOptionsOpened, setHasModelOptionsOpened] = useState(false);
  const [selectedOllamaModel, setSelectedOllamaModel] = useState(() => {
    // Load selected Ollama model from localStorage on initial load
    return localStorage.getItem('selectedOllamaModel') || "";
  });
  const [showOllamaOptions, setShowOllamaOptions] = useState(false);
  const [hasOllamaOptionsOpened, setHasOllamaOptionsOpened] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatBarPosition, setChatBarPosition] = useState("center");
  const [openMenuId, setOpenMenuId] = useState(null); // Track which three-dot menu is open
  const [user, setUser] = useState(null); // Firebase user
  const [authLoading, setAuthLoading] = useState(true); // Loading state for authentication
  const [profileMenuOpen, setProfileMenuOpen] = useState(false); // Track if profile menu is open
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false); // Track if logout confirmation is open
  const [newMessageIds, setNewMessageIds] = useState(new Set()); // Track new messages for animation

  const getApiUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    return import.meta.env.VITE_API_URL || 'https://your-railway-backend-url.railway.app';
  };
  
  // Load user's API keys from Firebase (only if not already in localStorage)
  const loadApiKeys = async (userId) => {
    if (!userId) return;
    
    try {
      console.log("Loading API keys for user:", userId);
      
      // Only load from Firebase if not already present locally
      const localApiKey = localStorage.getItem('apiKey');
      if (!localApiKey) {
        // Load OpenAI API key from Firebase
        const openaiKey = await getFirebaseApiKey(userId, 'openai');
        console.log("Loaded OpenAI key from Firebase:", openaiKey ? "Key found" : "No key found");
        if (openaiKey) {
          setApiKey(openaiKey);
          // Also save to localStorage for future use
          localStorage.setItem('apiKey', openaiKey);
        }
      } else {
        console.log("API key already loaded from localStorage");
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
  const abortControllerRef = useRef(null);
  const profileMenuRef = useRef(null);

  const models = ["gpt-4.1", "Claude", "Gemini-Flash", "Gemini-Pro", "Groq-GPT-OSS-20B", "Groq-Kimi-K2", "Ollama-Local"];
  const ollamaModels = [
    "phi3:3.8b", "mistral:7b", "llama3:8b", "gemma:2b", "gemma3:4b",
    "gemma:7b", "codegemma:2b", "codegemma:7b", "starcoder2:3b", "deepseek-coder:6.7b",
  ];

  // Function to get API link for each model
  const getApiLink = (model) => {
    switch (model) {
      case "gpt-4.1":
        return "https://platform.openai.com/signup";
      case "Claude":
        return "https://www.anthropic.com/api";
      case "Gemini-Flash":
      case "Gemini-Pro":
        return "https://ai.google.dev/";
      case "Groq-GPT-OSS-20B":
      case "Groq-Kimi-K2":
        return "https://console.groq.com/keys";
      case "Ollama-Local":
        return "https://ollama.com/download";
      default:
        return "#";
    }
  };

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
      // Don't respond to hover events if the logout confirmation dialog is open
      if (!showLogoutConfirmation) {
        if (e.clientX <= 10) setSidebarOpen(true);
        else if (sidebarOpen && e.clientX > 240) setSidebarOpen(false);
      }
    };
    window.addEventListener("mousemove", handleHover);
    return () => window.removeEventListener("mousemove", handleHover);
  }, [sidebarOpen, showLogoutConfirmation]);

  // Reset openMenuId and profileMenuOpen when sidebar closes
  useEffect(() => {
    if (!sidebarOpen) {
      setOpenMenuId(null);
      setProfileMenuOpen(false);
    }
  }, [sidebarOpen]);

  // Save selected model to localStorage whenever it changes
  useEffect(() => {
    if (selectedModel) {
      localStorage.setItem('selectedModel', selectedModel);
    }
  }, [selectedModel]);

  // Save selected Ollama model to localStorage whenever it changes
  useEffect(() => {
    if (selectedOllamaModel) {
      localStorage.setItem('selectedOllamaModel', selectedOllamaModel);
    }
  }, [selectedOllamaModel]);

  // Save API key to localStorage whenever it changes (but don't save empty strings)
  useEffect(() => {
    if (apiKey && apiKey.trim() !== "") {
      localStorage.setItem('apiKey', apiKey);
      console.log("API key saved to localStorage");
    } else if (apiKey === "" && localStorage.getItem('apiKey')) {
      // Only remove from localStorage if explicitly set to empty (not on initial load)
      console.log("API key cleared from localStorage");
      localStorage.removeItem('apiKey');
    }
  }, [apiKey]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages && messages.length > 0) {
      localStorage.setItem('currentMessages', JSON.stringify(messages));
      console.log("Messages saved to localStorage:", messages.length, "messages");
    }
  }, [messages]);

  useEffect(() => {
    setChatBarPosition(messages && messages.length > 0 ? "bottom" : "center");
  }, [messages]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (selectorRef.current && !selectorRef.current.contains(e.target)) {
        setShowSelector(false);
        setShowModelOptions(false);
        setShowOllamaOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debug authentication status
  const debugAuth = () => {
    console.log("Auth object:", auth);
    console.log("GoogleProvider:", googleProvider);
    console.log("Current user:", auth.currentUser);
    
    // Check if popup redirect is working
    try {
      debugFirebaseConfig();
    } catch (err) {
      console.error("Error in debugFirebaseConfig:", err);
    }
  };

  // Monitor chatSessions state changes
  useEffect(() => {
    console.log("🔍 chatSessions state changed:", chatSessions.length, "sessions");
    console.log("Sessions array:", chatSessions);
  }, [chatSessions]);

  // Force refresh sessions when user changes
  useEffect(() => {
    const loadSessions = async () => {
      if (user && user.uid) {
        console.log("🔄 User detected, force refreshing sessions for:", user.email);
        try {
          const sessions = await getUserSessions(user.uid);
          console.log("🔄 Force refresh - got sessions:", sessions.length);
          if (sessions && sessions.length > 0) {
            setChatSessions(sessions);
          }
        } catch (error) {
          console.error("🔄 Force refresh error:", error);
        }
      }
    };

    if (user && !authLoading) {
      loadSessions();
    }
  }, [user, authLoading]);
  // Monitor messages state changes - REMOVED AUTO-SORTING to prevent infinite loop
  useEffect(() => {
    console.log("💬 Messages state changed:", messages.length, "messages");
    if (messages.length > 0) {
      // Log each message with its timestamp for debugging
      messages.forEach((msg, idx) => {
        console.log(`  ${idx + 1}. [${msg.type}] ${msg.content.substring(0, 30)}... (${msg.timestamp})`);
      });
    }
  }, [messages]);

  // Firebase authentication listener
  useEffect(() => {
    // Debug authentication status
    debugAuth();
    
    let isInitialLoad = true;
    
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      console.log("🔐 Auth state changed, user:", currentUser?.email || "null");
      console.log("Is initial load:", isInitialLoad);
      
      setUser(currentUser);
      setAuthLoading(false);
      
      if (currentUser) {
        // Load user's chat sessions from Firebase
        const loadUserSessions = async () => {
          try {
            console.log("📥 Loading sessions for user:", currentUser.uid);
            const sessions = await getUserSessions(currentUser.uid);
            console.log("📦 Raw sessions from Firebase:", sessions);
            
            if (sessions && sessions.length > 0) {
              console.log("*** SETTING CHAT SESSIONS ***", sessions);
              setChatSessions(sessions);
              console.log("✅ Chat sessions loaded from Firebase:", sessions.length, "sessions available");
              console.log("Sessions:", JSON.stringify(sessions, null, 2));
              
              // Verify state was set (this will show in next render)
              setTimeout(() => {
                console.log("⏱️ Verifying chatSessions state after 1 second...");
              }, 1000);
              
              // Load messages for the first (most recent) session
              const firstSession = sessions[0];
              try {
                const messages = await getSessionMessages(firstSession.id);
                console.log("💬 Loaded messages for current session:", messages.length);
                
                // Ensure messages are sorted before setting state
                const sortedMessages = [...messages].sort((a, b) => {
                  return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
                });
                
                setMessages(sortedMessages);
                setCurrentSessionId(firstSession.id);
                setChatBarPosition(sortedMessages && sortedMessages.length > 0 ? "bottom" : "center");
              } catch (error) {
                console.error("❌ Error loading session messages:", error);
                // Start with empty messages if loading fails
                setMessages([]);
                setCurrentSessionId(firstSession.id);
              }
            } else {
              // No sessions in Firebase, create a new one
              console.log("🆕 No sessions found in Firebase, creating new session");
              try {
                const newChatData = await createFirebaseChatSession(currentUser.uid, "New Chat");
                console.log("✨ New session created:", newChatData);
                setChatSessions([newChatData]);
                setCurrentSessionId(newChatData.id);
                setMessages([]);
                setChatBarPosition("center");
              } catch (error) {
                console.error("❌ Error creating new session:", error);
                setChatSessions([]);
                setMessages([]);
              }
            }
            
            // Load user's API keys
            loadApiKeys(currentUser.uid);
          } catch (error) {
            console.error("❌ Error loading user data:", error);
            // On error, start with empty sessions
            setChatSessions([]);
            setMessages([]);
          }
        };
        
        loadUserSessions();
      } else if (!isInitialLoad) {
        // Only clear on explicit logout, not on initial mount
        // User logged out - clear all chat state and user-specific data
        console.log("👋 User logged out, clearing chat state");
        setMessages([]);
        setChatSessions([]);
        setCurrentSessionId(Date.now()); // Reset to new session ID
        setApiKey(""); // Clear API key from state
        
        // Clear user-specific data from localStorage
        localStorage.removeItem('apiKey');
        localStorage.removeItem('chatSessions');
        localStorage.removeItem('currentMessages');
        localStorage.removeItem('currentSessionId');
        localStorage.removeItem('selectedModel');
        localStorage.removeItem('selectedOllamaModel');
        
        // Reset other user-specific state
        setSelectedModel("");
        setSelectedOllamaModel("");
        setInputValue("");
        setNewMessageIds(new Set());
      }
      
      isInitialLoad = false;
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
      
      // Close profile menu when clicking outside
      if (profileMenuOpen && profileMenuRef.current && 
          !profileMenuRef.current.contains(e.target) && 
          !e.target.closest('.profile-menu-btn')) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileMenuOpen]);

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

  // ✅ FIXED addMessage with Firebase integration
  const addMessage = async (content, type, language = null, intro = null, isError = false) => {
    const safeContent = content === null || content === undefined ? "" : String(content);
    // Use a more precise timestamp for message ID to ensure ordering
    const messageId = Date.now() + Math.random();
    
    const newMessage = {
      id: messageId,
      type,
      content: safeContent,
      language,
      intro: intro || null, // Add intro field
      isError: isError, // Add error flag
      timestamp: new Date().toISOString()
    };
    
    // Update UI immediately - append to the end
    setMessages((prev) => [...prev, newMessage]);

    // Track new message for animation
    setNewMessageIds((prev) => new Set([...prev, messageId]));

    // Calculate animation duration based on content length
    const lines = safeContent.split('\n');
    const isCodeContent = language && language !== "plaintext";
    
    let contentDuration;
    if (isCodeContent) {
      // Code content animates line by line
      const baseDelay = 300; // ms per line
      const animationDuration = 500; // ms for each line animation
      contentDuration = (lines.length * baseDelay) + animationDuration;
    } else {
      // Plaintext content streams character by character (35 chars per second from WordTypewriter)
      contentDuration = (safeContent.length / 35) * 1000;
    }
    
    // Calculate intro text streaming duration (35 chars per second from WordTypewriter)
    const introDuration = intro ? (intro.length / 35) * 1000 : 0;
    
    // Total duration is the LONGER of intro or content, plus buffer
    const totalDuration = Math.max(contentDuration, introDuration) + 1000; // Extra 1s buffer

    // Remove animation after calculated duration
    setTimeout(() => {
      setNewMessageIds((prev) => {
        const updated = new Set(prev);
        updated.delete(messageId);
        return updated;
      });
    }, totalDuration);

    
    if (user && currentSessionId) {
      try {
        // Save message to Firebase (role is either 'user' or 'assistant')
        const role = type === 'user' ? 'user' : 'assistant';
        await saveFirebaseMessage(currentSessionId, safeContent, role, language, intro);
        
        // Update session title in Firebase if this is the first user message
        if (type === 'user' && messages.length === 0) {
          await updateFirebaseSessionTitle(currentSessionId, safeContent);
          
          // IMMEDIATELY update local state with new title
          setChatSessions(prev => {
            const existingSessionIndex = prev.findIndex(s => s.id === currentSessionId);
            if (existingSessionIndex >= 0) {
              const updatedSession = {
                ...prev[existingSessionIndex],
                title: safeContent
              };
              const newSessions = [...prev];
              newSessions[existingSessionIndex] = updatedSession;
              return newSessions;
            }
            return prev;
          });
        }
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
          // Ensure messages is always an array, even if undefined
          messages: [...(prev[existingSessionIndex].messages || []), newMessage],
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
            prompt: inputValue, model: modelToUse,
            apiKey: selectedModel !== "Ollama-Local" ? apiKey : null,
          }),
          signal: abortControllerRef.current.signal, 
        });
        const data = await res.json();
        if (res.ok && data?.response) {

          const responseLanguage = data.language || "python";
          console.log("Response language:", responseLanguage); // Debug the language
          console.log("Response intro:", data.intro); // Debug the intro
          addMessage(data.response, "assistant", responseLanguage, data.intro);
        } else {
          addMessage(`⚠️ ${data.error || "Error contacting backend"}`, "assistant", "plaintext", null, true);
        }
      } catch (err) {
        console.error("Chat error:", err);
        
        if (err.name === 'AbortError') {
          console.log("Request was aborted");
          setLoading(false); 
          return; 
        }
        
        let errorMessage = "⚠️ Error contacting backend";
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
          errorMessage = "⚠️ Network error - please check your internet connection";
        }
        addMessage(errorMessage, "assistant", "plaintext", null, true);
      } finally {
        
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
    
    
    if (user) {
      try {
        await deleteFirebaseSession(sessionId);
      } catch (error) {
        console.error("Error deleting session from Firebase:", error);
      }
    }
    
    
    setChatSessions(prev => prev.filter(session => session.id !== sessionId));
    
    
    if (sessionId === currentSessionId) {
      newChat();
    }
  };
  
  
  const toggleMenu = (sessionId, e) => {
    
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
            <div className="user-profile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#4285F4',
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: '300',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  borderRadius: '50%',
                  marginRight: '12px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.1)',
                  letterSpacing: '0.5px'
                }}>
                  {(user.email || '?').charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <div className="user-name">{user.displayName || user.email}</div>
                </div>
              </div>
              <div className="profile-menu-container">
                <button 
                  className="profile-menu-btn" 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }} 
                  title="Menu"
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="4" cy="10" r="1.5" fill="currentColor"/>
                    <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
                    <circle cx="16" cy="10" r="1.5" fill="currentColor"/>
                  </svg>
                </button>
                {profileMenuOpen && (
                  <div className="profile-dropdown-menu" ref={profileMenuRef}>
                    <button 
                      className="profile-menu-item" 
                      onClick={() => {
                        setShowLogoutConfirmation(true);
                        setProfileMenuOpen(false);
                        setSidebarOpen(false); 
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Log out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button 
              className="sign-in-btn" 
              onClick={() => {
                console.log("Sign in button clicked");
                
                
                debugAuth();
                
                try {
                  signInWithGoogle()
                    .then(user => {
                      console.log("Sign in successful:", user);
                    })
                    .catch(err => {
                      console.error("Sign in error:", err);
                      // More user-friendly error message
                      if (err.code === 'auth/popup-blocked') {
                        alert("Sign-in popup was blocked by your browser. Please allow popups for this site and try again.");
                      } else if (err.code === 'auth/popup-closed-by-user') {
                        console.log("Popup closed by user - no alert needed");
                      } else {
                        alert("Sign-in failed: " + (err.message || "Unknown error"));
                      }
                    });
                } catch (err) {
                  console.error("Error calling signInWithGoogle:", err);
                  alert("Failed to initialize sign-in process. Please check the console for more details.");
                }
              }}
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
              onClick={async () => {
                
                if (abortControllerRef.current) {
                  abortControllerRef.current.abort();
                  abortControllerRef.current = null;
                }
                
                setCurrentSessionId(session.id);
                
                
                if (user) {
                  try {
                    console.log("Loading messages for session:", session.id);
                    const messages = await getSessionMessages(session.id);
                    console.log("Loaded messages from Firebase:", messages.length);
                    
                    // Ensure messages are sorted by timestamp before setting state
                    const sortedMessages = [...messages].sort((a, b) => {
                      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
                    });
                    
                    console.log("Messages sorted, setting state");
                    setMessages(sortedMessages);
                    setChatBarPosition(sortedMessages && sortedMessages.length > 0 ? "bottom" : "center");
                  } catch (error) {
                    console.error("Error loading session messages:", error);
                    // Fall back to local messages if Firebase fails
                    setMessages(session.messages || []);
                    setChatBarPosition(session.messages && session.messages.length > 0 ? "bottom" : "center");
                  }
                } else {
                  // Not logged in, use local messages
                  setMessages(session.messages || []);
                  setChatBarPosition(session.messages && session.messages.length > 0 ? "bottom" : "center");
                }
                
                // Always reset loading state when switching chats
                setLoading(false);
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
        {/* Sidebar toggle and new chat buttons */}
        <div className="top-buttons-wrapper">
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="16" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fill="none"/>
              <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
          <button className="newchat-btn" onClick={newChat}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
              <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2"/>
              <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        </div>
        
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
                    <li key={m} className="model-option">
                      <div 
                        className="model-option-name"
                        onClick={() => {
                          setSelectedModel(m);
                          setShowModelOptions(false);
                          if (m !== "Ollama-Local") setOllamaStatus(null);
                        }}
                      >
                        {m}
                      </div>
                      <a 
                        href={getApiLink(m)} 
                        className="get-api-link"
                        onClick={(e) => e.stopPropagation()}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {m === "Ollama-Local" ? "Know More" : "Get API"}
                      </a>
                    </li>
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
          {/* Welcome message typing animation - only show when no messages and chat bar is centered */}
          {messages.length === 0 && chatBarPosition === "center" && (
            <div className="typing-container">
              <div className="typing-text">
                {(() => {
                  if (user) {
                    
                    let name = user.displayName || user.email || "";
                    
                    if (!user.displayName && user.email) {
                      name = user.email.split("@")[0];
                    }

                    const firstName = name.split(" ")[0];
                    return `hello there  ${firstName}`;
                  }
                  return "hello there?";
                })()}
              </div>
            </div>
          )}
          <div className="chat-container" ref={chatContainerRef} style={{ marginBottom: '0' }}>
            {messages.map((message) => {
              
              console.log(`Message ID ${message.id} Type: ${message.type} Language: ${message.language}`);
              
              const isNewMessage = newMessageIds.has(message.id);
              const isNewAssistantMessage = isNewMessage && message.type === 'assistant';
              
              
              if (message.type === "user") {
                return (
                  <div key={message.id} className={`message ${message.type} ${isNewMessage ? 'message-animate' : ''}`}>
                    <button
                      className={`copy user-copy ${copiedMessageId === message.content ? 'focus' : ''}`}
                      onClick={() => handleCopy(message.content)}
                      data-content={message.content}
                    >
                      <span className="tooltip" data-text-initial="Copy" data-text-end="Copied!"></span>
                      <svg className="clipboard" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                        <path d="M9.5 1h-3a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                      </svg>
                      <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                      </svg>
                    </button>
                    {message.content}
                  </div>
                );
              }
              
              
              return (
              <div key={message.id}>
                {/* Intro text - OUTSIDE the message box */}
                {message.intro && (
                  <p style={{ 
                    marginBottom: '8px', 
                    marginLeft: '12px',
                    color: '#d4d4d4', 
                    fontSize: '14px', 
                    lineHeight: '1.6',
                    fontWeight: '400'
                  }}>
                    {isNewMessage ? <WordTypewriter text={message.intro} /> : message.intro}
                  </p>
                )}
                
                {/* Message box - contains ONLY the code/content */}
                {/* Show message box only if there's actual code (not plaintext or error) */}
                {message.language && message.language !== "plaintext" ? (
                <div className={`message ${message.type} ${isNewMessage ? 'message-animate' : ''}`}>
                {/* Copy button for assistant messages */}
                <button
                  className={`copy ${copiedMessageId === message.content ? 'focus' : ''}`}
                  onClick={() => handleCopy(message.content)}
                  data-content={message.content}
                >
                  <span className="tooltip" data-text-initial="Copy" data-text-end="Copied!"></span>
                  <svg className="clipboard" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                    <path d="M9.5 1h-3a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                  </svg>
                  <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1 0 .708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                  </svg>
                </button>
                {isNewAssistantMessage ? (
                  
                  <TypewriterText 
                    content={message.content} 
                    isCode={message.language && message.language !== "plaintext"} 
                    language={message.language}
                    intro={message.intro}
                  />
                ) : (
                  
                  <>
                      <div className="vs-code-container">
                        <SyntaxHighlighter
                        language={mapLanguageForSyntaxHighlighter(message.language)}
                        style={okaidiaStyle}
                        wrapLongLines={false}
                        showLineNumbers={true}
                        lineNumberStyle={{ 
                          color: '#858585', 
                          paddingRight: '16px',
                          marginRight: '16px',
                          borderRight: '1px solid #333',
                          textAlign: 'right'
                        }}
                        customStyle={{ 
                          background: 'transparent',
                          borderRadius: '0',
                          padding: '16px',
                          margin: '0',
                          border: 'none',
                          overflowX: 'auto',
                          overflowY: 'visible',
                          whiteSpace: 'pre',
                          wordWrap: 'normal',
                          wordBreak: 'normal',
                          maxWidth: 'none'
                        }}
                        codeTagProps={{
                          style: {
                            fontFamily: "'Cascadia Code', 'Fira Code', Consolas, Monaco, monospace",
                            fontSize: '14px',
                            lineHeight: '1.6'
                          }
                        }}
                      >
                        {message.content}
                      </SyntaxHighlighter>
                    </div>
                  </>
                )}
              </div>
              ) : (
                /* Render plaintext messages without the code box */
                <div style={{ 
                  color: message.isError ? '#ff6b6b' : '#e3e3e3',
                  fontSize: '15px',
                  lineHeight: '1.6',
                  fontWeight: '400',
                  marginTop: '8px'
                }}>
                  {isNewMessage ? <WordTypewriterMarkdown text={message.content} /> : <MarkdownText text={message.content} />}
                </div>
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
              ref={textareaRef} 
              rows={1} 
              className="message-input" 
              placeholder="Ask anything..."
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value.replace(/^\n/, ""))}
              onKeyDown={(e) => {
                // Send message when Enter is pressed (without Shift)
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault(); // Prevent new line
                  if (inputValue.trim()) {
                    sendMessage();
                  }
                }
              }}
            />
            <button className={`send-btn ${inputValue.trim() ? "active" : ""}`} onClick={sendMessage} disabled={!inputValue.trim()}>➤</button>
          </div>
        </div>
      </div>
      
      {/* Logout confirmation dialog */}
      {showLogoutConfirmation && (
        <div 
          className="modal-overlay"
          onClick={(e) => {
            // Prevent clicks on the overlay from closing the dialog
            e.stopPropagation();
          }}
        >
          <div className="logout-confirmation-dialog" onClick={(e) => e.stopPropagation()}>
            <h2>Are you sure</h2>
               <h2>you want to log out?</h2>
            <p>Log out as {user && (user.email || "your account")}?</p>
            <div className="logout-buttons">
              <button 
                className="cancel-button" 
                onClick={() => setShowLogoutConfirmation(false)}
              >
                Cancel
              </button>
              <button 
                className="logout-button" 
                onClick={() => {
                  signOutUser();
                  setShowLogoutConfirmation(false);
                }}
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatInterface;

