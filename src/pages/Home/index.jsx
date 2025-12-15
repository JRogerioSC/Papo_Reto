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
  const [users, setUsers] = useState([])
  const [name, setName] = useState('')
  const [cadastrado, setCadastrado] = useState(false)

  const inputName = useRef(null)
  const inputMenssage = useRef(null)
  const scrollRef = useRef(null)
  const socketRef = useRef(null)

  // 🔄 BUSCAR MENSAGENS
  async function getUsers() {
    try {
      const res = await axios.get(`${BACKEND_URL}/usuarios`)
      const valid = res.data.filter(
        m => m.createdAt && m.name && m.menssage
      )
      setUsers(valid)
    } catch {
      toast.error('Erro ao carregar mensagens')
    }
  }

  // 👤 ENTRAR (CADASTRO LOCAL)
  function cadastrarNome() {
    const nome = inputName.current.value.trim()

    if (!nome) {
      return toast.warning('Digite um nome válido')
    }

    localStorage.setItem('username', nome)
    setName(nome)
    setCadastrado(true)
    toast.success('Bem-vindo!')
  }

  // 📤 ENVIAR MENSAGEM
  async function enviarMensagem() {
    const menssage = inputMenssage.current.value.trim()
    if (!menssage) return

    try {
      await axios.post(`${BACKEND_URL}/usuarios`, { name, menssage })
      inputMenssage.current.value = ''
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao enviar')
    }
  }

  // 🗑 APAGAR
  async function deleteUsers(id) {
    try {
      await axios.delete(`${BACKEND_URL}/usuarios/${id}`, {
        data: { name }
      })
    } catch {
      toast.error('Erro ao apagar')
    }
  }

  // 🔌 SOCKET (SÓ APÓS CADASTRO)
  useEffect(() => {
    if (!cadastrado) return

    getUsers()

    socketRef.current = io(BACKEND_URL)

    socketRef.current.on('nova_mensagem', msg => {
      if (msg?.createdAt) {
        setUsers(prev => [...prev, msg])
      }
    })

    socketRef.current.on('mensagem_apagada', id => {
      setUsers(prev => prev.filter(m => m.id !== id))
    })

    return () => socketRef.current.disconnect()
  }, [cadastrado])

  // ⬇️ SCROLL
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [users])

  // 🚪 SE NÃO CADASTRADO → TELA DE CADASTRO (RETORNO IMEDIATO)
  if (!cadastrado) {
    return (
      <div className="container">
        <ToastContainer />

        <div className="register-container">
          <h2>Papo Reto</h2>

          <input
            className="nome"
            ref={inputName}
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
        {users.map(user => {
          const isMine =
            user.name.toLowerCase() === name.toLowerCase()

          return (
            <div
              key={user.id}
              className={`message-wrapper ${isMine ? 'mine' : 'other'}`}
            >
              <div className="bubble-row">
                <div className={`card ${isMine ? 'mine' : 'other'}`}>
                  {!isMine && <span className="user-name">{user.name}</span>}
                  <span className="text">{user.menssage}</span>
                </div>

                {isMine && (
                  <button
                    className="delete"
                    onClick={() => deleteUsers(user.id)}
                  >
                    🗑
                  </button>
                )}
              </div>

              <span className={`time ${isMine ? 'mine' : 'other'}`}>
                {new Date(user.createdAt).toLocaleTimeString('pt-BR', {
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
          className="menssage"
          ref={inputMenssage}
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

