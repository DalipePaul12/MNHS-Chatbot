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
} from 'lucide-react'
import './Chatbot.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const SUGGESTED_QUESTIONS = [
  { icon: BookOpen,      label: 'History of MNHS',         text: 'What is the history of MNHS?' },
  { icon: GraduationCap, label: 'Strands Offered',          text: 'What are the strands offered?' },
  { icon: ClipboardList, label: 'Enrollment Requirements',  text: 'What are the enrollment requirements?' },
  { icon: ShieldCheck,   label: 'School Rules',             text: 'What are the school rules?' },
  { icon: Building2,     label: 'Facilities',               text: 'What facilities does MNHS have?' },
  { icon: Eye,           label: 'Vision & Mission',         text: 'What is the vision and mission?' },
]

export default function Chatbot() {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: '👋 **Magandang araw!** I am the MNHS Virtual Assistant.\n\nAsk me anything about **Malabon National High School** — history, programs, enrollment, rules, facilities, and more!',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    const question = text || input.trim()
    if (!question || loading) return

    setMessages((prev) => [...prev, { role: 'user', text: question }])
    setInput('')
    setLoading(true)

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
          text: '❌ Sorry, I could not connect to the server. Please make sure the backend is running.',
          error: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleInput = (e) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  return (
    <div className="cw">

      {/* Background blobs */}
      <div className="bg-blob blob-1" />
      <div className="bg-blob blob-2" />
      <div className="bg-blob blob-3" />

      {/* Card */}
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
          <div className="header-pill">
            <span className="pill-dot" />
            Live
          </div>
        </div>

        {/* Messages */}
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

        {/* Suggested Questions */}
        <div className="suggestions">
          {SUGGESTED_QUESTIONS.map(({ icon: Icon, label, text }) => (
            <button
              key={label}
              className="chip"
              onClick={() => sendMessage(text)}
              disabled={loading}
            >
              <Icon size={13} strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>

        {/* Input */}
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