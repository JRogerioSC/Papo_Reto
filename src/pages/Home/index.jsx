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
  const [name] = useState(() => localStorage.getItem('papo_reto_nome') || '')
  const [conectando, setConectando] = useState(true)
  const [gravando, setGravando] = useState(false)

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const enviandoAudioRef = useRef(false)

  const inputMessage = useRef(null)
  const fileInputRef = useRef(null)
  const scrollRef = useRef(null)
  const socketRef = useRef(null)

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
  }

  async function registrarPushNotifications() {
    if (!('serviceWorker' in navigator)) return
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return

    const registration = await navigator.serviceWorker.ready
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      })
    }

    await axios.post(`${BACKEND_URL}/subscribe`, { name, subscription })
  }

  function normalizarMensagem(msg) {
    return {
      id: msg.id,
      text: msg.text || '',
      mediaUrl: msg.mediaUrl || null,
      mediaType: msg.mediaType || null,
      fileName: msg.fileName || null,
      name: msg.name,
      createdAt:
        msg.createdAt ||
        msg.created_at ||
        msg.timestamp ||
        new Date().toISOString()
    }
  }

  function formatarDataHora(date) {
    if (!date) return ''

    const d = new Date(date)
    if (isNaN(d.getTime())) return ''

    const hoje = new Date()
    const ontem = new Date()
    ontem.setDate(hoje.getDate() - 1)

    const mesmaData = (a, b) =>
      a.getDate() === b.getDate() &&
      a.getMonth() === b.getMonth() &&
      a.getFullYear() === b.getFullYear()

    const dataTexto = mesmaData(d, hoje)
      ? 'Hoje'
      : mesmaData(d, ontem)
        ? 'Ontem'
        : d.toLocaleDateString('pt-BR')

    const horaTexto = d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })

    return `${dataTexto} • ${horaTexto}`
  }

  useEffect(() => {
    let ativo = true

    async function validarUsuario() {
      if (!name) {
        localStorage.removeItem('papo_reto_nome')
        window.location.href = '/cadastro'
        return
      }

      try {
        const res = await axios.get(
          `${BACKEND_URL}/usuarios/validar/${encodeURIComponent(name)}`
        )

        if (!res.data.exists) {
          localStorage.removeItem('papo_reto_nome')
          window.location.href = '/cadastro'
          return
        }

        await iniciarChat()
      } catch (err) {
        console.error(err)
        localStorage.removeItem('papo_reto_nome')
        window.location.href = '/cadastro'
      }
    }

    async function iniciarChat() {
      const res = await axios.get(`${BACKEND_URL}/usuarios`)
      if (!ativo) return

      setMessages(res.data.map(normalizarMensagem))

      await registrarPushNotifications()

      socketRef.current = io(BACKEND_URL)
      socketRef.current.emit('register', name.trim().toLowerCase())

      socketRef.current.on('nova_mensagem', msg => {
        const m = normalizarMensagem(msg)
        setMessages(prev =>
          prev.some(x => x.id === m.id) ? prev : [...prev, m]
        )
      })

      socketRef.current.on('mensagem_apagada', id => {
        setMessages(prev => prev.filter(m => m.id !== id))
      })

      setConectando(false)
    }

    validarUsuario()

    return () => {
      ativo = false
      socketRef.current?.disconnect()
    }
  }, [name])


  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function enviarMensagem() {
    const text = inputMessage.current.value.trim()
    if (!text) return
    await axios.post(`${BACKEND_URL}/usuarios`, { name, menssage: text })
    inputMessage.current.value = ''
  }

  async function enviarArquivo(file) {
    if (!file) return
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', name)
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
    enviandoAudioRef.current = false

    mediaRecorderRef.current.ondataavailable = e =>
      audioChunksRef.current.push(e.data)

    mediaRecorderRef.current.onstop = async () => {
      if (enviandoAudioRef.current) return
      enviandoAudioRef.current = true

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

  if (conectando) return <div>Conectando ao Servidor...</div>

  return (
    <div className="container">
      <ToastContainer />

      <div className="chat">
        {messages.map(msg => {
          const isMine = msg.name.toLowerCase() === name.toLowerCase()

          return (
            <div
              key={msg.id}
              className={`message-wrapper ${isMine ? 'mine me' : 'other'}`}
            >
              <div className="bubble-row">
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
                    <div className="file-message">
                      <span>📎</span>
                      <a href={msg.mediaUrl} target="_blank" rel="noreferrer">
                        {msg.fileName || 'Arquivo'}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* ✅ DATA + HORA FORA DO BALÃO (USANDO SEU CSS .time) */}
              <span className={`time ${isMine ? 'right' : 'left'}`}>
                {formatarDataHora(msg.createdAt)}
              </span>
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
        >
          📎
        </button>

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
