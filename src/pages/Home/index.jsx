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
  const [name, setName] = useState('')
  const [cadastrado, setCadastrado] = useState(false)

  const inputName = useRef(null)
  const inputMessage = useRef(null)
  const scrollRef = useRef(null)
  const socketRef = useRef(null)

  // 🔄 BUSCAR MENSAGENS
  async function getMessages() {
    try {
      const res = await axios.get(`${BACKEND_URL}/usuarios`)
      setMessages(res.data)
    } catch {
      toast.error('Erro ao carregar mensagens')
    }
  }

  // 👤 CADASTRAR USUÁRIO (BACKEND REAL)
  async function cadastrarNome() {
    const nome = inputName.current.value.trim()
    if (!nome) return toast.warning('Digite um nome válido')

    try {
      await axios.post(`${BACKEND_URL}/usuarios/cadastrar`, {
        name: nome
      })

      localStorage.setItem('username', nome)
      setName(nome)
      setCadastrado(true)
      toast.success('Bem-vindo!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao cadastrar')
    }
  }

  // 📤 ENVIAR MENSAGEM
  async function enviarMensagem() {
    const text = inputMessage.current.value.trim()
    if (!text) return

    try {
      await axios.post(`${BACKEND_URL}/usuarios`, {
        name,
        menssage: text
      })

      inputMessage.current.value = ''
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao enviar')
    }
  }

  // 🗑 APAGAR MENSAGEM
  async function deleteMessage(id) {
    try {
      await axios.delete(`${BACKEND_URL}/usuarios/${id}`, {
        data: { name }
      })
    } catch {
      toast.error('Erro ao apagar')
    }
  }

  // 🔌 SOCKET
  useEffect(() => {
    if (!cadastrado) return

    getMessages()

    socketRef.current = io(BACKEND_URL)
    socketRef.current.emit('register', name)

    socketRef.current.on('nova_mensagem', msg => {
      setMessages(prev => [...prev, msg])
    })

    socketRef.current.on('mensagem_apagada', id => {
      setMessages(prev => prev.filter(m => m.id !== id))
    })

    return () => socketRef.current.disconnect()
  }, [cadastrado])

  // ⬇️ SCROLL AUTOMÁTICO
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 🚪 TELA DE CADASTRO
  if (!cadastrado) {
    return (
      <div className="container">
        <ToastContainer />

        <div className="register-container">
          <h2>Papo Reto</h2>

          <input
            ref={inputName}
            className="nome"
            placeholder="Digite seu nome"
          />

          <button className="cadastrar" onClick={cadastrarNome}>
            ENTRAR
          </button>
        </div>
      </div>
    )
  }

  // 💬 CHAT
  return (
    <div className="container">
      <ToastContainer />

      <div className="chat">
        {messages.map(msg => {
          const isMine =
            msg.name.toLowerCase() === name.toLowerCase()

          return (
            <div
              key={msg.id}
              className={`message-wrapper ${isMine ? 'mine' : 'other'}`}
            >
              <div className="bubble-row">
                <div className={`card ${isMine ? 'mine' : 'other'}`}>
                  {!isMine && (
                    <span className="user-name">{msg.name}</span>
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

