import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import './style.css'
import { io } from 'socket.io-client'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { register } from './serviceWorkerRegistration'

register()

const BACKEND_URL = 'https://api-papo-reto.onrender.com'

function Home() {
  const [messages, setMessages] = useState([])
  const [name] = useState('rogerio')
  const [conectando, setConectando] = useState(true)

  // 🎙️ ÁUDIO
  const [gravando, setGravando] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const enviandoAudioRef = useRef(false)

  const inputMessage = useRef(null)
  const scrollRef = useRef(null)
  const socketRef = useRef(null)

  // =====================
  // 🔌 SOCKET + LOAD
  // =====================
  useEffect(() => {
    async function iniciar() {
      try {
        const res = await axios.get(`${BACKEND_URL}/usuarios`)
        setMessages(res.data)

        socketRef.current = io(BACKEND_URL)
        socketRef.current.emit('register', name)

        socketRef.current.on('nova_mensagem', msg => {
          setMessages(prev =>
            prev.some(m => m.id === msg.id) ? prev : [...prev, msg]
          )
        })

        socketRef.current.on('mensagem_apagada', id => {
          setMessages(prev => prev.filter(m => m.id !== id))
        })

        setConectando(false)
      } catch {
        toast.error('Erro ao conectar no servidor')
      }
    }

    iniciar()
    return () => socketRef.current?.disconnect()
  }, [name])

  // =====================
  // 📜 AUTO SCROLL
  // =====================
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // =====================
  // 🗑️ APAGAR
  // =====================
  async function apagarMensagem(id) {
    try {
      await axios.delete(`${BACKEND_URL}/usuarios/${id}`, {
        data: { name }
      })
    } catch {
      toast.error('Erro ao apagar mensagem')
    }
  }

  // =====================
  // 🎙️ ÁUDIO
  // =====================
  async function iniciarGravacao() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []
      enviandoAudioRef.current = false

      mediaRecorderRef.current.ondataavailable = e => {
        audioChunksRef.current.push(e.data)
      }

      mediaRecorderRef.current.onstop = async () => {
        if (enviandoAudioRef.current) return
        enviandoAudioRef.current = true

        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm'
        })

        const formData = new FormData()
        formData.append('audio', audioBlob)
        formData.append('name', name)

        await axios.post(`${BACKEND_URL}/usuarios/audio`, formData)
      }

      mediaRecorderRef.current.start()
      setGravando(true)
    } catch {
      toast.error('Permissão de microfone negada')
    }
  }

  function pararGravacao() {
    mediaRecorderRef.current?.stop()
    setGravando(false)
  }

  // =====================
  // ✉️ TEXTO
  // =====================
  async function enviarMensagem() {
    const text = inputMessage.current.value.trim()
    if (!text) return

    await axios.post(`${BACKEND_URL}/usuarios`, {
      name,
      menssage: text
    })

    inputMessage.current.value = ''
  }

  if (conectando) return <div>Conectando...</div>

  // =====================
  // 🖥️ UI FINAL (DATA + HORA)
  // =====================
  return (
    <div className="container">
      <ToastContainer />

      <div className="chat">
        {messages.map((msg, index) => {
          const isMine = msg.name.toLowerCase() === name.toLowerCase()

          const dataAtual = new Date(msg.createdAt).toLocaleDateString('pt-BR')
          const dataAnterior =
            index > 0
              ? new Date(messages[index - 1].createdAt).toLocaleDateString('pt-BR')
              : null

          const mostrarData = dataAtual !== dataAnterior

          return (
            <div key={msg.id}>
              {/* 📅 DATA */}
              {mostrarData && (
                <div className="date-divider">
                  <span>{dataAtual}</span>
                </div>

              )}

              <div
                className={`message-wrapper ${isMine ? 'mine' : 'other'}`}
              >
                <div className="bubble-row">
                  <div className={`card ${isMine ? 'mine' : 'other'}`}>
                    {msg.mediaType === 'audio' ? (
                      <div className="audio-wrapper">
                        <audio controls src={msg.mediaUrl} />
                      </div>
                    ) : (
                      <span className="text">{msg.text}</span>
                    )}

                    {isMine && (
                      <button
                        className="delete"
                        onClick={() => apagarMensagem(msg.id)}
                      >
                        🗑
                      </button>
                    )}
                  </div>
                </div>

                {/* ⏰ HORA */}
                <span className="time">
                  {new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
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

        <button
          className={`enviar ${gravando ? 'gravando' : ''}`}
          onClick={gravando ? pararGravacao : iniciarGravacao}
        >
          {gravando ? '⏹' : '🎤'}
        </button>

        <button className="enviar" onClick={enviarMensagem}>
          ➤
        </button>
      </div>
    </div>
  )
}

export default Home
