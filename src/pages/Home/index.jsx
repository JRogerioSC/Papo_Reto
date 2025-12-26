import Cadastro from './Cadastro'
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
  const [name, setName] = useState(
    () => localStorage.getItem('papo_reto_nome') || ''
  )
  const [cadastrado, setCadastrado] = useState(!!name)
  const [conectando, setConectando] = useState(false)
  const [gravando, setGravando] = useState(false)

  const inputMessage = useRef(null)
  const fileInputRef = useRef(null)
  const scrollRef = useRef(null)
  const socketRef = useRef(null)

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  /* ===================== INIT CHAT ===================== */
  useEffect(() => {
    if (!cadastrado) return

    async function iniciar() {
      try {
        setConectando(true)

        // 🔹 carregar histórico
        const res = await axios.get(`${BACKEND_URL}/usuarios`)
        setMessages(res.data)

        // 🔹 socket
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
      } catch {
        toast.error('Erro ao conectar')
      } finally {
        setConectando(false)
      }
    }

    iniciar()
    return () => socketRef.current?.disconnect()
  }, [cadastrado, name])

  /* ===================== SCROLL ===================== */
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /* ===================== AÇÕES ===================== */
  async function enviarMensagem() {
    const text = inputMessage.current.value.trim()
    if (!text) return

    await axios.post(`${BACKEND_URL}/usuarios`, {
      name,
      menssage: text
    })

    inputMessage.current.value = ''
  }

  async function enviarArquivo(file) {
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', name)

    try {
      await axios.post(`${BACKEND_URL}/usuarios/arquivo`, formData)
    } catch {
      toast.error('Erro ao enviar arquivo')
    } finally {
      fileInputRef.current.value = ''
    }
  }

  async function iniciarGravacao() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorderRef.current = new MediaRecorder(stream)
    audioChunksRef.current = []

    mediaRecorderRef.current.ondataavailable = e =>
      audioChunksRef.current.push(e.data)

    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      const formData = new FormData()
      formData.append('audio', blob)
      formData.append('name', name)

      await axios.post(`${BACKEND_URL}/usuarios/audio`, formData)
    }

    mediaRecorderRef.current.start()
    setGravando(true)
  }

  function pararGravacao() {
    mediaRecorderRef.current?.stop()
    setGravando(false)
  }

  async function apagarMensagem(id) {
    try {
      await axios.delete(`${BACKEND_URL}/usuarios/${id}`, {
        data: { name }
      })
    } catch {
      toast.error('Erro ao apagar mensagem')
    }
  }

  /* ===================== RENDER ===================== */
  if (!cadastrado) {
    return (
      <Cadastro
        onCadastro={nome => {
          localStorage.setItem('papo_reto_nome', nome)
          setName(nome)
          setCadastrado(true)
        }}
      />
    )
  }

  if (conectando) {
    return <div>Conectando ao servidor...</div>
  }

  return (
    <div className="container">
      <ToastContainer />

      <div className="chat">
        {messages.map(msg => {
          const isMine = msg.name.toLowerCase() === name.toLowerCase()

          return (
            <div
              key={msg.id}
              className={`message-wrapper ${isMine ? 'mine' : 'other'}`}
            >
              <div className={`card ${isMine ? 'mine' : 'other'}`}>
                {isMine && (
                  <button
                    className="delete"
                    onClick={() => apagarMensagem(msg.id)}
                  >
                    🗑️
                  </button>
                )}

                {!isMine && <div className="username">{msg.name}</div>}
                {msg.text && <span className="text">{msg.text}</span>}

                {msg.mediaType === 'audio' && (
                  <audio controls src={msg.mediaUrl} />
                )}

                {msg.mediaType === 'image' && (
                  <img src={msg.mediaUrl} className="chat-image" />
                )}

                {msg.mediaType === 'video' && (
                  <video controls src={msg.mediaUrl} className="chat-video" />
                )}

                {msg.mediaType === 'file' && (
                  <a href={msg.mediaUrl} target="_blank" rel="noreferrer">
                    📎 Arquivo
                  </a>
                )}
              </div>

              <span className="time">
                {new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          )
        })}
        <div ref={scrollRef} />
      </div>

      <div className="input-area">
        <input
          ref={inputMessage}
          placeholder="Digite sua mensagem"
          onKeyDown={e => e.key === 'Enter' && enviarMensagem()}
        />

        <input
          type="file"
          hidden
          ref={fileInputRef}
          onChange={e => enviarArquivo(e.target.files[0])}
        />

        <button onClick={() => fileInputRef.current.click()}>📎</button>
        <button onClick={gravando ? pararGravacao : iniciarGravacao}>
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
