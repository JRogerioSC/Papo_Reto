import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import './style.css'
import { io } from 'socket.io-client'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { register } from './serviceWorkerRegistration'

register()

const BACKEND_URL = 'https://api-papo-reto.onrender.com'

/* ===================== */
/* 🔔 PUSH SUBSCRIBE */
/* ===================== */
async function subscribePush(name) {
  if (!('serviceWorker' in navigator)) return
  if (!('PushManager' in window)) return

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return

  const reg = await navigator.serviceWorker.ready
  const existing = await reg.pushManager.getSubscription()
  if (existing) return

  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey:
      'BCDQq4OUvCl6IS2j7X0PJuMwvUT8wFT5Nb6i5WZ0Q8ojL_gKNxEoyH3wsxuCX2AV7R4RyalvZlk11FPz_tekPuY'
  })

  await axios.post(`${BACKEND_URL}/subscribe`, {
    name,
    subscription
  })
}

/* ===================== */
/* 💬 HOME */
/* ===================== */
function Home() {
  const [messages, setMessages] = useState([])
  const [name, setName] = useState('')
  const [cadastrado, setCadastrado] = useState(false)
  const [conectando, setConectando] = useState(true)

  const inputName = useRef(null)
  const inputMessage = useRef(null)
  const scrollRef = useRef(null)
  const socketRef = useRef(null)

  function capitalizarNome(nome) {
    return nome.charAt(0).toUpperCase() + nome.slice(1).toLowerCase()
  }

  function resetarUsuario() {
    localStorage.removeItem('username')
    socketRef.current?.disconnect()
    setName('')
    setCadastrado(false)
    toast.info('Usuário removido. Cadastre-se novamente.')
  }

  /* ===================== */
  /* 🔄 VALIDAR USUÁRIO */
  /* ===================== */
  useEffect(() => {
    const savedName = localStorage.getItem('username')
    if (!savedName) {
      setConectando(false)
      return
    }

    axios
      .get(`${BACKEND_URL}/usuarios/validar/${savedName}`)
      .then(() => {
        setName(savedName)
        setCadastrado(true)
      })
      .catch(() => resetarUsuario())
      .finally(() => setConectando(false))
  }, [])

  async function getMessages() {
    const res = await axios.get(`${BACKEND_URL}/usuarios`)
    setMessages(res.data)
  }

  async function cadastrarNome() {
    let nome = inputName.current.value.trim()
    if (!nome) return toast.warning('Digite um nome válido')

    nome = capitalizarNome(nome)

    await axios.post(`${BACKEND_URL}/usuarios/cadastrar`, { name: nome })
    localStorage.setItem('username', nome)
    setName(nome)
    setCadastrado(true)

    await subscribePush(nome)
    toast.success('Bem-vindo!')
  }

  async function enviarMensagem() {
    const text = inputMessage.current.value.trim()
    if (!text) return

    try {
      await axios.post(`${BACKEND_URL}/usuarios`, {
        name,
        menssage: text
      })
      inputMessage.current.value = ''
    } catch {
      resetarUsuario()
    }
  }

  async function deleteMessage(id) {
    await axios.delete(`${BACKEND_URL}/usuarios/${id}`, {
      data: { name }
    })
  }

  /* ===================== */
  /* 🔌 SOCKET + MENSAGENS */
  /* ===================== */
  useEffect(() => {
    if (!cadastrado) return

    setConectando(true)

    Promise.all([
      getMessages(),
      subscribePush(name)
    ]).finally(() => setConectando(false))

    socketRef.current = io(BACKEND_URL, {
      transports: ['websocket'],
      reconnection: true
    })

    socketRef.current.emit('register', name)

    socketRef.current.on('nova_mensagem', msg =>
      setMessages(prev => [...prev, msg])
    )

    socketRef.current.on('mensagem_apagada', id =>
      setMessages(prev => prev.filter(m => m.id !== id))
    )

    return () => socketRef.current.disconnect()
  }, [cadastrado])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /* ===================== */
  /* 🔄 LOADING */
  /* ===================== */
  if (conectando) {
    return (
      <div className="container">
        <ToastContainer />
        <div className="loading">
          <div className="spinner"></div>
          <h2>Conectando ao servidor...</h2>
          <p>Aguarde um instante</p>
        </div>
      </div>
    )
  }

  /* ===================== */
  /* 📝 CADASTRO */
  /* ===================== */
  if (!cadastrado) {
    return (
      <div className="container">
        <ToastContainer />
        <div className="register-container">
          <h2>Papo Reto</h2>
          <input ref={inputName} className="nome" placeholder="Digite seu nome" />
          <button className="cadastrar" onClick={cadastrarNome}>
            ENTRAR
          </button>
        </div>
      </div>
    )
  }

  /* ===================== */
  /* 💬 CHAT */
  /* ===================== */
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
              <div className="bubble-row">
                <div className={`card ${isMine ? 'mine' : 'other'}`}>
                  {!isMine && (
                    <span className="user-name">
                      {capitalizarNome(msg.name)}
                    </span>
                  )}
                  <span className="text">{msg.text}</span>
                </div>

                {isMine && (
                  <button
                    className="delete"
                    onClick={() => deleteMessage(msg.id)}
                  >
                    🗑
                  </button>
                )}
              </div>

              <span className={`time ${isMine ? 'mine' : 'other'}`}>
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
          className="menssage"
          placeholder="Digite sua mensagem"
          onKeyDown={e => e.key === 'Enter' && enviarMensagem()}
        />
        <button className="enviar" onClick={enviarMensagem}>
          ENVIAR
        </button>
      </div>
    </div>
  )
}

export default Home
