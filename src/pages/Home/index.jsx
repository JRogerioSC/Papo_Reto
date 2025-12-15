import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import './style.css'
import { io } from 'socket.io-client'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { register } from './serviceWorkerRegistration'

register()

const PUBLIC_VAPID_KEY =
  'BCDQq4OUvCl6IS2j7X0PJuMwvUT8wFT5Nb6i5WZ0Q8ojL_gKNxEoyH3wsxuCX2AV7R4RyalvZlk11FPz_tekPuY'

const BACKEND_URL = 'https://api-papo-reto.onrender.com'

function Home() {
  const [users, setUsers] = useState([])
  const [name, setName] = useState(localStorage.getItem('username') || '')
  const [cadastrado, setCadastrado] = useState(!!localStorage.getItem('username'))

  const inputName = useRef()
  const inputMenssage = useRef()
  const scrollRef = useRef()
  const socketRef = useRef(null)

  async function getUsers() {
    try {
      const res = await axios.get(`${BACKEND_URL}/usuarios`)
      setUsers(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  async function cadastrarNome() {
    const nome = inputName.current.value.trim()
    if (!nome) return toast.warning('Digite um nome válido')

    try {
      await axios.post(`${BACKEND_URL}/usuarios/cadastrar`, { name: nome })
      localStorage.setItem('username', nome)
      setName(nome)
      setCadastrado(true)
      toast.success('Nome cadastrado!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro')
    }
  }

  async function enviarMensagem() {
    const menssage = inputMenssage.current.value.trim()
    if (!menssage) return

    try {
      await axios.post(`${BACKEND_URL}/usuarios`, { name, menssage })
      inputMenssage.current.value = ''
    } catch {
      toast.error('Erro ao enviar')
    }
  }

  async function deleteUsers(id) {
    try {
      await axios.delete(`${BACKEND_URL}/usuarios/${id}`, { data: { name } })
      getUsers()
    } catch {
      toast.error('Erro ao deletar')
    }
  }

  useEffect(() => {
    getUsers()
    socketRef.current = io(BACKEND_URL)

    socketRef.current.on('nova_mensagem', getUsers)

    return () => socketRef.current.disconnect()
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [users])

  return (
    <div className="container">
      <ToastContainer />

      {/* 🔹 CHAT */}
      <div className="chat">
        {users.map(user => {
          const isMine =
            user.name.toLowerCase() === name.toLowerCase()

          return (
            <div
              key={user.id}
              className={`card ${isMine ? 'mine' : 'other'}`}
            >
              <p className="user-name">{user.name}</p>
              <span className="text">{user.menssage}</span>

              {isMine && (
                <button onClick={() => deleteUsers(user.id)}>🗑</button>
              )}
            </div>
          )
        })}
        <div ref={scrollRef} />
      </div>

      {/* 🔹 INPUTS */}
      {!cadastrado ? (
        <>
          <input
            className="nome"
            ref={inputName}
            placeholder="Digite seu nome"
          />
          <button className="cadastrar" onClick={cadastrarNome}>
            CADASTRAR
          </button>
        </>
      ) : (
        <>
          <input
            className="menssage"
            ref={inputMenssage}
            placeholder="Digite sua mensagem"
          />
          <button className="enviar" onClick={enviarMensagem}>
            ENVIAR
          </button>
        </>
      )}
    </div>
  )
}

export default Home

