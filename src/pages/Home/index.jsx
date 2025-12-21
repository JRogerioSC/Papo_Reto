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
  const [cadastrado, setCadastrado] = useState(() => !!localStorage.getItem('papo_reto_nome'))
  const [nomeCadastro, setNomeCadastro] = useState('')
  const [conectando, setConectando] = useState(true)
  const [gravando, setGravando] = useState(false)

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const enviandoAudioRef = useRef(false)

  const inputMessage = useRef(null)
  const scrollRef = useRef(null)
  const socketRef = useRef(null)

  // 🔔 PUSH
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
          applicationServerKey: VAPID_PUBLIC_KEY
        })
      }

      await axios.post(`${BACKEND_URL}/push/subscribe`, { name, subscription })
    } catch (err) {
      console.error(err)
    }
  }

  function normalizarMensagem(msg) {
    return {
      ...msg,
      text: msg.text || '',
      createdAt: msg.createdAt || new Date().toISOString()
    }
  }

  function formatarDataHora(msg) {
    const d = new Date(msg.createdAt)
    return d.toLocaleString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    })
  }

  useEffect(() => {
    if (!name) {
      setCadastrado(false)
      setConectando(false)
      return
    }

    async function iniciar() {
      try {
        const valida = await axios.get(`${BACKEND_URL}/usuarios/validar/${name}`)
        if (!valida.data.exists) {
          localStorage.removeItem('papo_reto_nome')
          setCadastrado(false)
          return
        }

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
        localStorage.removeItem('papo_reto_nome')
        setCadastrado(false)
      }
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
      toast.error('Você só pode apagar suas próprias mensagens')
    }
  }

  async function iniciarGravacao() {
    try {
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
    } catch {
      toast.error('Permissão de microfone negada')
    }
  }

  function pararGravacao() {
    mediaRecorderRef.current?.stop()
    setGravando(false)
  }

  async function enviarMensagem() {
    const text = inputMessage.current.value.trim()
    if (!text) return
    await axios.post(`${BACKEND_URL}/usuarios`, { name, menssage: text })
    inputMessage.current.value = ''
  }

  async function cadastrar() {
    if (!nomeCadastro.trim()) return
    await axios.post(`${BACKEND_URL}/usuarios`, {
      name: nomeCadastro,
      menssage: '👋 entrou no chat'
    })
    localStorage.setItem('papo_reto_nome', nomeCadastro)
    setName(nomeCadastro)
    setCadastrado(true)
  }

  if (!cadastrado) {
    return (
      <div className="container cadastro">
        <ToastContainer />
        <h2>Papo Reto</h2>
        <input value={nomeCadastro} onChange={e => setNomeCadastro(e.target.value)} />
        <button onClick={cadastrar}>Criar conta</button>
      </div>
    )
  }

  if (conectando) return <div>Conectando...</div>

  return (
    <div className="container">
      <ToastContainer />
      <div className="chat">
        {messages.map(msg => (
          <div key={msg.id} className="message-wrapper">
            {msg.mediaType === 'audio' ? (
              <audio controls src={msg.mediaUrl} />
            ) : (
              <span>{msg.text}</span>
            )}
            <button onClick={() => apagarMensagem(msg.id)}>🗑</button>
            <span>{formatarDataHora(msg)}</span>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <div className="input-area">
        <input ref={inputMessage} onKeyDown={e => e.key === 'Enter' && enviarMensagem()} />
        <button onClick={gravando ? pararGravacao : iniciarGravacao}>
          {gravando ? '⏹' : '🎤'}
        </button>
        <button onClick={enviarMensagem}>➤</button>
      </div>
    </div>
  )
}

export default Home