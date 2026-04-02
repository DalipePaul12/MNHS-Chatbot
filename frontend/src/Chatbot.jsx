import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import {
  School,
  Send,
  Sparkles,
  User,
  Bot,
  BookOpen,
  GraduationCap,
  ClipboardList,
  ShieldCheck,
  Building2,
  Eye,
  ArrowLeft
} from 'lucide-react'
import './Chatbot.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Dynamic Categorized Suggestions
const SUGGESTIONS_DATA = {
  default: [
    { id: 'history', icon: BookOpen, label: 'History of MNHS', text: 'Tell me about the history of MNHS.', action: 'category' },
    { id: 'strands', icon: GraduationCap, label: 'Strands Offered', text: 'What are the strands offered here?', action: 'category' },
    { id: 'enrollment', icon: ClipboardList, label: 'Enrollment', text: 'How do I enroll?', action: 'category' },
    { id: 'facilities', icon: Building2, label: 'Facilities', text: 'What facilities do you have?', action: 'category' },
    { id: 'rules', icon: ShieldCheck, label: 'School Rules', text: 'What are the school rules?', action: 'send' },
    { id: 'vision', icon: Eye, label: 'Vision & Mission', text: 'What is the vision and mission?', action: 'send' },
  ],
  history: [
    { icon: BookOpen, label: 'When was it founded?', text: 'When was Malabon National High School founded?', action: 'send' },
    { icon: BookOpen, label: 'Who is the founder?', text: 'Who founded MNHS?', action: 'send' },
    { icon: ArrowLeft, label: 'Back to Menu', action: 'back' }
  ],
  strands: [
    { icon: GraduationCap, label: 'STEM', text: 'What is the STEM strand in MNHS?', action: 'send' },
    { icon: GraduationCap, label: 'ABM', text: 'Does MNHS offer ABM?', action: 'send' },
    { icon: GraduationCap, label: 'HUMSS', text: 'What is HUMSS?', action: 'send' },
    { icon: GraduationCap, label: 'TVL', text: 'What TVL tracks are available?', action: 'send' },
    { icon: ArrowLeft, label: 'Back to Menu', action: 'back' }
  ],
  enrollment: [
    { icon: ClipboardList, label: 'Requirements', text: 'What are the enrollment requirements?', action: 'send' },
    { icon: ClipboardList, label: 'Schedule', text: 'When is the enrollment period?', action: 'send' },
    { icon: ClipboardList, label: 'Transferees', text: 'How to enroll as a transferee?', action: 'send' },
    { icon: ArrowLeft, label: 'Back to Menu', action: 'back' }
  ],
  facilities: [
    { icon: Building2, label: 'Library', text: 'Does MNHS have a library?', action: 'send' },
    { icon: Building2, label: 'Laboratories', text: 'What kind of laboratories are there?', action: 'send' },
    { icon: ArrowLeft, label: 'Back to Menu', action: 'back' }
  ]
}

export default function Chatbot() {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: '👋 **Magandang araw!** I am the MNHS Virtual Assistant.\n\nAsk me anything about **Malabon National High School** — history, programs, enrollment, rules, facilities, and more!',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  
  // New States for Suggestions Logic
  const [currentCategory, setCurrentCategory] = useState('default')
  const [showSuggestions, setShowSuggestions] = useState(true) 
  
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, currentCategory, showSuggestions])

  const sendMessage = async (text, isCategoryClick = false) => {
    const question = text || input.trim()
    if (!question || loading) return

    setMessages((prev) => [...prev, { role: 'user', text: question }])
    setInput('')
    setLoading(true)
    
    // If they typed manually or clicked a final question, hide suggestions entirely
    if (!isCategoryClick) {
      setShowSuggestions(false)
    }

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      const res = await axios.post(`${API_URL}/chat`, { question })
      setMessages((prev) => [...prev, { role: 'bot', text: res.data.answer }])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: 'Sorry, I could not connect to the server. Please make sure the backend is running.',
          error: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestionClick = (item) => {
    if (item.action === 'category') {
      // Send a message to the bot, but keep suggestions open and switch to the sub-category
      sendMessage(item.text, true)
      setCurrentCategory(item.id)
    } else if (item.action === 'back') {
      // Go back to the main menu of suggestions without sending a message
      setCurrentCategory('default')
    } else {
      // Send the final question and hide the suggestions permanently
      sendMessage(item.text, false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage() // Sending manually will trigger hide suggestions
    }
  }

  const handleInput = (e) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  return (
    <div className="cw">
      <div className="card">

        {/* Header */}
        <div className="header">
          <div className="header-icon-wrap">
            <School size={26} strokeWidth={2} color="#fff" />
          </div>
          <div className="header-text">
            <h1>MNHS Virtual Assistant</h1>
            <p>
              <Sparkles size={11} />
              Malabon National High School · Powered by Groq AI
            </p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="messages">
          {messages.map((msg, i) => (
            <div key={i} className={`row ${msg.role} ${msg.error ? 'err' : ''}`}>
              <div className={`avatar-icon ${msg.role}`}>
                {msg.role === 'bot'
                  ? <Bot size={16} strokeWidth={2} />
                  : <User size={16} strokeWidth={2} />
                }
              </div>
              <div className="bubble">
                {msg.role === 'bot'
                  ? <ReactMarkdown>{msg.text}</ReactMarkdown>
                  : <p>{msg.text}</p>
                }
              </div>
            </div>
          ))}

          {loading && (
            <div className="row bot">
              <div className="avatar-icon bot">
                <Bot size={16} strokeWidth={2} />
              </div>
              <div className="bubble typing">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {showSuggestions && (
          <div className="suggestions">
            {SUGGESTIONS_DATA[currentCategory].map((item, index) => {
              const Icon = item.icon
              return (
                <button
                  key={index}
                  className="chip"
                  onClick={() => handleSuggestionClick(item)}
                  disabled={loading}
                >
                  <Icon size={13} strokeWidth={2} />
                  {item.label}
                </button>
              )
            })}
          </div>
        )}

        {/* Input Bar */}
        <div className="input-bar">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about MNHS…"
            rows={1}
            disabled={loading}
          />
          <button
            className={`send-btn ${input.trim() && !loading ? 'active' : ''}`}
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
          >
            <Send size={17} strokeWidth={2.5} />
          </button>
        </div>

      </div>
    </div>
  )
}