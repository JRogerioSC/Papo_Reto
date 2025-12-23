import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import './style.css'
import { io } from 'socket.io-client'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { register } from './serviceWorkerRegistration'

register()

const BACKEND_URL = 'https://api-papo-reto.onrender.com'
const VAPID_PUBLIC_KEY =
  'BCDQq4OUvCl6IS2j7X0PJuMwvUT8wFT5Nb6i5WZ0Q8ojL_gKNxEoyH3wsxuCX2AV7R4RyalvZlk11FPz_tekPuY'

function Home() {
  const [messages, setMessages] = useState([])
  const [name, setName] = useState(() => localStorage.getItem('papo_reto_nome') || '')
  const [cadastrado] = useState(() => !!localStorage.getItem('papo_reto_nome'))
  const [conectando, setConectando] = useState(true)

  const [gravando, setGravando] = useState(false)
  const [enviandoArquivo, setEnviandoArquivo] = useState(false)

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const enviandoAudioRef = useRef(false)

  const inputMessage = useRef(null)
  const fileInputRef = useRef(null)
  const scrollRef = useRef(null)
  const socketRef = useRef(null)

  function normalizarMensagem(msg) {
    return {
      ...msg,
      text: msg.text || msg.menssage || '',
      createdAt: msg.createdAt || msg.created_at || msg.date || new Date().toISOString()
    }
  }

  function formatarHora(msg) {
    return new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  useEffect(() => {
    if (!name) return

    async function iniciar() {
      const res = await axios.get(`${BACKEND_URL}/usuarios`)
      setMessages(res.data.map(normalizarMensagem))

      socketRef.current = io(BACKEND_URL)
      socketRef.current.emit('register', name)

      socketRef.current.on('nova_mensagem', msg => {
        const m = normalizarMensagem(msg)
        setMessages(prev => (prev.some(x => x.id === m.id) ? prev : [...prev, m]))
      })

      socketRef.current.on('mensagem_apagada', id => {
        setMessages(prev => prev.filter(m => m.id !== id))
      })

      setConectando(false)
    }

    iniciar()
    return () => socketRef.current?.disconnect()
  }, [name])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function apagarMensagem(id) {
    try {
      await axios.delete(`${BACKEND_URL}/usuarios/${id}`, { data: { name } })
    } catch {
      toast.error('Você só pode apagar suas mensagens')
    }
  }

  async function enviarArquivo(file) {
    if (!file) return
    try {
      setEnviandoArquivo(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', name)
      await axios.post(`${BACKEND_URL}/usuarios/arquivo`, formData)
    } catch {
      toast.error('Erro ao enviar arquivo')
    } finally {
      setEnviandoArquivo(false)
      fileInputRef.current.value = ''
    }
  }

  async function enviarMensagem() {
    const text = inputMessage.current.value.trim()
    if (!text) return
    await axios.post(`${BACKEND_URL}/usuarios`, { name, menssage: text })
    inputMessage.current.value = ''
  }

  if (!cadastrado) return null
  if (conectando) return <div>Conectando...</div>

  return (
    <div className="container">
      <ToastContainer />

      <div className="chat">
        {messages.map(msg => {
          const isMine = msg.name?.toLowerCase() === name.toLowerCase()

          return (
            <div key={msg.id} className={`message-wrapper ${isMine ? 'mine' : 'other'}`}>
              <div className="bubble-row">
                <div className={`card ${isMine ? 'mine' : 'other'}`}>

                  {!isMine && <div className="username">{msg.name}</div>}

                  {msg.text && <div className="text">{msg.text}</div>}

                  {msg.mediaType === 'audio' && (
                    <div className="audio-wrapper">
                      <audio controls src={msg.mediaUrl} />
                    </div>
                  )}

                  {msg.mediaType === 'image' && (
                    <img src={msg.mediaUrl} className="chat-image" />
                  )}

                  {msg.mediaType === 'video' && (
                    <video controls className="chat-video" src={msg.mediaUrl} />
                  )}

                  {/* ✅ BLOCO INTEGRADO PARA O CSS DE ARQUIVO */}
                  {msg.mediaType === 'file' && (
                    <div className="file-message">
                      <span className="file-icon">📎</span>

                      <div className="file-info">
                        <span className="file-name">
                          {msg.fileName || 'Arquivo'}
                        </span>

                        <a
                          href={msg.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="file-download"
                        >
                          Baixar
                        </a>
                      </div>
                    </div>
                  )}

                  {isMine && (
                    <button className="delete" onClick={() => apagarMensagem(msg.id)}>
                      🗑
                    </button>
                  )}

                  <div className={`time ${isMine ? 'right' : 'left'}`}>
                    {formatarHora(msg)}
                  </div>

                </div>
              </div>
            </div>
          )
        })}
        <div ref={scrollRef} />
      </div>

      <div className="input-area">
        <input
          ref={inputMessage}
          className="menssage"
          placeholder="Digite sua mensagem"
          onKeyDown={e => e.key === 'Enter' && enviarMensagem()}
        />

        <input
          type="file"
          ref={fileInputRef}
          hidden
          onChange={e => enviarArquivo(e.target.files[0])}
        />

        <button
          className="file-button"
          onClick={() => fileInputRef.current.click()}
          disabled={enviandoArquivo}
        >
          📎
        </button>

        <button className="enviar" onClick={enviarMensagem}>
          ➤
        </button>
      </div>
    </div>
  )
}

export default Home
