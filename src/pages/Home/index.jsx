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

  // =====================
  // 🔔 PUSH
  // =====================
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
  }

  async function registrarPushNotifications() {
    try {
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
    } catch (err) {
      console.error(err)
    }
  }

  // =====================
  // 🔒 NORMALIZA
  // =====================
  function normalizarMensagem(msg) {
    return {
      ...msg,
      text: msg.text || msg.menssage || '',
      createdAt: msg.createdAt || msg.created_at || msg.date || new Date().toISOString()
    }
  }

  // =====================
  // ⏰ DATA
  // =====================
  function formatarHora(msg) {
    return new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // =====================
  // 🔌 SOCKET
  // =====================
  useEffect(() => {
    if (!name) return

    async function iniciar() {
      try {
        const res = await axios.get(`${BACKEND_URL}/usuarios`)
        setMessages(res.data.map(normalizarMensagem))

        await registrarPushNotifications()

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
      } catch {
        setConectando(false)
      }
    }

    iniciar()
    return () => socketRef.current?.disconnect()
  }, [name])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // =====================
  // 🗑️ APAGAR
  // =====================
  async function apagarMensagem(id) {
    try {
      await axios.delete(`${BACKEND_URL}/usuarios/${id}`, { data: { name } })
    } catch {
      toast.error('Você só pode apagar suas mensagens')
    }
  }

  // =====================
  // 🎙️ ÁUDIO
  // =====================
  async function iniciarGravacao() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorderRef.current = new MediaRecorder(stream)
    audioChunksRef.current = []
    enviandoAudioRef.current = false

    mediaRecorderRef.current.ondataavailable = e => audioChunksRef.current.push(e.data)
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

  // =====================
  // 📎 ARQUIVO
  // =====================
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

  // =====================
  // ✉️ TEXTO
  // =====================
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

                  {msg.mediaType === 'file' && (
                    <a href={msg.mediaUrl} target="_blank" rel="noreferrer">
                      📎 {msg.fileName || 'Arquivo'}
                    </a>
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
