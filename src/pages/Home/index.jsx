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

  // 🔐 NOME SALVO
  const [name, setName] = useState(() => {
    return localStorage.getItem('papo_reto_nome') || ''
  })

  const [cadastrado, setCadastrado] = useState(() => {
    return !!localStorage.getItem('papo_reto_nome')
  })

  const [nomeCadastro, setNomeCadastro] = useState('')
  const [conectando, setConectando] = useState(true)

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
    if (!name) {
      setCadastrado(false)
      setConectando(false)
      return
    }

    async function iniciar() {
      try {
        const valida = await axios.get(
          `${BACKEND_URL}/usuarios/validar/${name}`
        )

        if (!valida.data.exists) {
          localStorage.removeItem('papo_reto_nome')
          setCadastrado(false)
          setConectando(false)
          return
        }

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
        localStorage.removeItem('papo_reto_nome')
        setCadastrado(false)
        setConectando(false)
      }
    }

    iniciar()
    return () => socketRef.current?.disconnect()
  }, [name])

  // =====================
  // 🗑️ APAGAR
  // =====================
  async function apagarMensagem(id) {
    try {
      await axios.delete(`${BACKEND_URL}/usuarios/${id}`, {
        data: { name }
      })
    } catch {
      toast.error('Você só pode apagar suas próprias mensagens')
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

  // =====================
  // 📝 CADASTRO
  // =====================
  async function cadastrar() {
    if (!nomeCadastro.trim()) return

    try {
      await axios.post(`${BACKEND_URL}/usuarios`, {
        name: nomeCadastro,
        menssage: '👋 entrou no chat'
      })

      localStorage.setItem('papo_reto_nome', nomeCadastro)

      setName(nomeCadastro)
      setCadastrado(true)
      setConectando(true)
    } catch {
      toast.error('Nome já existe ou erro no servidor')
    }
  }

  // =====================
  // 🛑 CADASTRO
  // =====================
  if (!cadastrado) {
    return (
      <div className="container cadastro">
        <ToastContainer />
        <h2>Papo Reto</h2>

        <input
          placeholder="Digite seu nome"
          value={nomeCadastro}
          onChange={e => setNomeCadastro(e.target.value)}
        />

        <button onClick={cadastrar}>Criar conta</button>
      </div>
    )
  }

  if (conectando) return <div>Conectando ao servidor...</div>

  // =====================
  // 🖥️ CHAT
  // =====================
  return (
    <div className="container">
      <ToastContainer />

      <div className="chat">
        {messages.map(msg => {
          const isMine =
            msg.name?.toLowerCase() === name.toLowerCase()

          if (msg.text?.includes('entrou no chat')) {
            return (
              <div key={msg.id} className="system-message">
                {msg.name} entrou no chat 👋
              </div>
            )
          }

          return (
            <div
              key={msg.id}
              className={`message-wrapper ${isMine ? 'mine' : 'other'}`}
            >
              <div className="bubble-row">
                <div className={`card ${isMine ? 'mine' : 'other'}`}>

                  {!isMine && (
                    <div className="username">{msg.name}</div>
                  )}

                  {msg.mediaType === 'audio' ? (
                    <audio controls src={msg.mediaUrl} />
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

              <span className={`time ${isMine ? 'right' : 'left'}`}>
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
