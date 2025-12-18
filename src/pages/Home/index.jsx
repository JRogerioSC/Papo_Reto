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
  const [name] = useState('rogerio') // 🔴 ajuste depois se quiser login
  const [conectando, setConectando] = useState(true)

  // 🎙️ ÁUDIO
  const [gravando, setGravando] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  const inputMessage = useRef(null)
  const scrollRef = useRef(null)
  const socketRef = useRef(null)

  // =====================
  // 🔌 SOCKET + LOAD
  // =====================
  useEffect(() => {
    async function iniciar() {
      try {
        // 📥 mensagens
        const res = await axios.get(`${BACKEND_URL}/usuarios`)
        setMessages(res.data)

        // 🔌 socket
        socketRef.current = io(BACKEND_URL)

        socketRef.current.emit('register', name)

        socketRef.current.on('nova_mensagem', msg => {
          setMessages(prev => [...prev, msg])
        })

        socketRef.current.on('mensagem_apagada', id => {
          setMessages(prev => prev.filter(m => m.id !== id))
        })

        setConectando(false)
      } catch (err) {
        toast.error('Erro ao conectar no servidor')
        console.error(err)
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
  // 🎙️ GRAVAÇÃO
  // =====================
  async function iniciarGravacao() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = e => {
        audioChunksRef.current.push(e.data)
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm'
        })

        console.log('🎧 Áudio gravado:', audioBlob)
        toast.success('Áudio gravado (envio no próximo passo)')
      }

      mediaRecorderRef.current.start()
      setGravando(true)
    } catch {
      toast.error('Permissão de microfone negada')
    }
  }

  function pararGravacao() {
    mediaRecorderRef.current.stop()
    setGravando(false)
  }

  // =====================
  // ✉️ ENVIAR TEXTO
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

  // =====================
  // ⏳ LOADING
  // =====================
  if (conectando) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    )
  }

  // =====================
  // 🖥️ UI
  // =====================
  return (
    <div className="container">
      <ToastContainer />

      <div className="chat">
        {messages.map(msg => (
          <div key={msg.id} className="message-wrapper mine">
            <div className="bubble-row">
              <div className="card mine">
                <span className="text">{msg.text}</span>
              </div>
            </div>
          </div>
        ))}
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
