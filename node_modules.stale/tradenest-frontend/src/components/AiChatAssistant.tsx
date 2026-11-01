import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Send, Bot, User as UserIcon, ExternalLink, ShoppingBag, RotateCcw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSendAiChatMessageMutation } from '../app/api'

interface Message {
  id: string
  sender: 'user' | 'assistant'
  text: string
  products?: any[]
  quickReplies?: string[]
}

export default function AiChatAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "👋 Hi there! I'm your **TRADENEST AI Shopping Assistant**. Looking for recommendations, top deals, or tracking an order?",
      quickReplies: ['🔥 Today\'s Deals', '👟 Men Shoes', '👗 Women Wear', '📦 Track Order', '🔄 Return Policy'],
    },
  ])

  const [sendAiChatMessage, { isLoading }] = useSendAiChatMessageMutation()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim()
    if (!textToSend || isLoading) return

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')

    try {
      const res = await sendAiChatMessage({ message: textToSend }).unwrap()
      const botMsg: Message = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: res.reply || "Here's what I found for you:",
        products: res.products,
        quickReplies: res.quickReplies,
      }
      setMessages((prev) => [...prev, botMsg])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'assistant',
          text: "I'm having a little trouble connecting right now. Please try asking again!",
          quickReplies: ['🔥 Today\'s Deals', '👟 Best Sellers'],
        },
      ])
    }
  }

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: "👋 Welcome back! How can I assist you with your shopping today?",
        quickReplies: ['🔥 Today\'s Deals', '📱 Electronics', '📦 Track Order'],
      },
    ])
  }

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="relative flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600 px-4 py-3 text-white shadow-xl hover:shadow-2xl transition focus:outline-none"
        >
          <div className="relative">
            <Bot className="h-6 w-6 text-white" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <span className="font-semibold text-sm hidden sm:inline">Ask AI Assistant</span>
        </motion.button>
      </div>

      {/* Slide-Up Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-4 sm:right-6 z-50 w-[92vw] max-w-[420px] h-[580px] max-h-[80vh] flex flex-col rounded-2xl bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-primary-600 to-indigo-700 text-white shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                  <Sparkles className="h-5 w-5 text-yellow-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-tight">TRADENEST AI Assistant</h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-white/80">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Ready to help 24/7</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleResetChat}
                  title="Clear conversation"
                  className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 transition"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close chat"
                  className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary-50/50 dark:bg-secondary-950/40">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-start gap-2 max-w-[88%]">
                    {msg.sender === 'assistant' && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300 mt-1">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-primary-600 text-white rounded-tr-none shadow-sm'
                          : 'bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 border border-secondary-200/80 dark:border-secondary-700/80 rounded-tl-none shadow-sm'
                      }`}
                    >
                      <div className="whitespace-pre-line">{msg.text}</div>
                    </div>
                    {msg.sender === 'user' && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary-200 text-secondary-700 dark:bg-secondary-800 dark:text-secondary-300 mt-1">
                        <UserIcon className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  {/* Render Product Cards if Returned */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-2.5 grid grid-cols-2 gap-2 w-full pl-9">
                      {msg.products.map((prod) => (
                        <Link
                          key={prod.id}
                          to={`/products/${prod.slug || prod.id}`}
                          onClick={() => setIsOpen(false)}
                          className="group rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 p-2 shadow-sm hover:shadow transition flex flex-col justify-between"
                        >
                          <div className="aspect-square w-full overflow-hidden rounded-lg bg-secondary-100 dark:bg-secondary-900 mb-2">
                            <img
                              src={prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'}
                              alt={prod.title}
                              className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold text-secondary-900 dark:text-secondary-100 line-clamp-1">
                              {prod.title}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-xs font-bold text-primary-600 dark:text-primary-400">
                                ₹{Number(prod.price).toLocaleString('en-IN')}
                              </span>
                              {prod.discountPercent > 0 && (
                                <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950/40 px-1 rounded">
                                  {prod.discountPercent}% OFF
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-center gap-1 text-[11px] font-medium text-primary-600 dark:text-primary-400 group-hover:underline">
                            View <ExternalLink className="h-3 w-3" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Quick Action Chips */}
                  {msg.quickReplies && (
                    <div className="mt-2 flex flex-wrap gap-1.5 pl-9">
                      {msg.quickReplies.map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(chip)}
                          className="rounded-full border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-950/40 px-2.5 py-1 text-[11px] font-medium text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900 transition"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-secondary-500 pl-9">
                  <div className="h-2 w-2 rounded-full bg-primary-600 animate-bounce"></div>
                  <div className="h-2 w-2 rounded-full bg-primary-600 animate-bounce [animation-delay:0.2s]"></div>
                  <div className="h-2 w-2 rounded-full bg-primary-600 animate-bounce [animation-delay:0.4s]"></div>
                  <span>TRADENEST AI is thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="p-3 bg-white dark:bg-secondary-900 border-t border-secondary-200 dark:border-secondary-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about products, orders, discounts..."
                className="flex-1 rounded-xl border border-secondary-300 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 px-3.5 py-2 text-xs sm:text-sm text-secondary-900 dark:text-secondary-100 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 transition shadow-sm"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
