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

  /* ===================== INIT ===================== */
  useEffect(() => {
    if (!cadastrado || !name) return

    async function iniciar() {
      try {
        setConectando(true)

        const res = await axios.get(`${BACKEND_URL}/mensagens`)
        setMessages(res.data)

        socketRef.current = io(BACKEND_URL, {
          transports: ['websocket']
        })

        socketRef.current.emit('register', name)

        socketRef.current.on('nova_mensagem', msg => {
          setMessages(prev =>
            prev.some(m => m.id === msg.id) ? prev : [...prev, msg]
          )
        })

        socketRef.current.on('mensagem_apagada', id => {
          setMessages(prev => prev.filter(m => m.id !== id))
        })
      } catch (err) {
        toast.error('Erro ao conectar')
        localStorage.removeItem('papo_reto_nome')
        setCadastrado(false)
        setName('')
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

  /* ===================== TEXTO ===================== */
  async function enviarMensagem() {
    const text = inputMessage.current.value.trim()
    if (!text) return

    try {
      await axios.post(`${BACKEND_URL}/mensagens`, {
        name,
        text
      })
      inputMessage.current.value = ''
    } catch {
      toast.error('Erro ao enviar mensagem')
    }
  }

  /* ===================== ARQUIVO ===================== */
  async function enviarArquivo(file) {
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', name)

    try {
      await axios.post(`${BACKEND_URL}/mensagens/arquivo`, formData)
    } catch {
      toast.error('Erro ao enviar arquivo')
    } finally {
      fileInputRef.current.value = ''
    }
  }

  /* ===================== ÁUDIO ===================== */
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

      try {
        await axios.post(`${BACKEND_URL}/mensagens/audio`, formData)
      } catch {
        toast.error('Erro ao enviar áudio')
      }
    }

    mediaRecorderRef.current.start()
    setGravando(true)
  }

  function pararGravacao() {
    mediaRecorderRef.current?.stop()
    setGravando(false)
  }

  /* ===================== DELETE ===================== */
  async function apagarMensagem(id) {
    try {
      await axios.delete(`${BACKEND_URL}/mensagens/${id}`, {
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

  if (conectando) return <div>Conectando...</div>

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
                  <button className="delete" onClick={() => apagarMensagem(msg.id)}>
                    🗑️
                  </button>
                )}

                {!isMine && <div className="username">{msg.name}</div>}
                {msg.text && <span className="text">{msg.text}</span>}

                {msg.mediaType === 'audio' && <audio controls src={msg.mediaUrl} />}
                {msg.mediaType === 'image' && <img src={msg.mediaUrl} />}
                {msg.mediaType === 'video' && <video controls src={msg.mediaUrl} />}
                {msg.mediaType === 'file' && (
                  <a href={msg.mediaUrl} target="_blank" rel="noreferrer">
                    📎 Arquivo
                  </a>
                )}
              </div>
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
        <button onClick={enviarMensagem}>➤</button>
      </div>
    </div>
  )
}

export default Home
