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

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
}

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
      console.error('Erro ao buscar mensagens:', err)
    }
  }

  async function cadastrarNome() {
    const nome = inputName.current.value.trim()
    if (!nome) {
      toast.warning('⚠️ Digite um nome válido.', { position: 'top-center' })
      return
    }

    try {
      await axios.post(`${BACKEND_URL}/usuarios/cadastrar`, { name: nome })
      localStorage.setItem('username', nome)
      setName(nome)
      setCadastrado(true)
      toast.success('✅ Nome cadastrado!', { position: 'top-center' })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao cadastrar', {
        position: 'top-center'
      })
    }
  }

  async function enviarMensagem() {
    const menssage = inputMenssage.current.value.trim()

    if (!menssage) return

    try {
      await axios.post(`${BACKEND_URL}/usuarios`, { name, menssage })
      inputMenssage.current.value = ''
    } catch (err) {
      toast.error('Erro ao enviar mensagem')
    }
  }

  async function deleteUsers(id) {
    try {
      await axios.delete(`${BACKEND_URL}/usuarios/${id}`, {
        data: { name }
      })
      getUsers()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao deletar')
    }
  }

  async function subscribeToPush() {
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js')
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
        })
        await axios.post(`${BACKEND_URL}/subscribe`, subscription)
      } catch (error) {
        console.error('Erro no push:', error)
      }
    }
  }

  useEffect(() => {
    getUsers()
    subscribeToPush()

    socketRef.current = io(BACKEND_URL)

    socketRef.current.on('connect', () => {
      socketRef.current.emit('register', name || 'visitante')
    })

    socketRef.current.on('nova_mensagem', () => {
      getUsers()
    })

    return () => socketRef.current?.disconnect()
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [users])

  return (
    <div className='container'>
      <ToastContainer />

      {users.map(user => {
        const isMine =
          user.name.toLowerCase() === name.toLowerCase()

        return (
          <div
            key={user.id}
            className={`card ${isMine ? 'mine' : 'other'}`}
          >
            <p className='user-name'>{user.name}</p>
            <span className='text'>{user.menssage}</span>

            {isMine && (
              <button onClick={() => deleteUsers(user.id)}>🗑</button>
            )}
          </div>
        )
      })}

      <div ref={scrollRef} />

      {!cadastrado ? (
        <>
          <input
            className='nome'
            ref={inputName}
            placeholder='Digite seu nome'
          />
          <button onClick={cadastrarNome}>CADASTRAR</button>
        </>
      ) : (
        <>
          <input
            className='menssage'
            ref={inputMenssage}
            placeholder='Digite sua mensagem'
          />
          <button onClick={enviarMensagem}>ENVIAR</button>
        </>
      )}
    </div>
  )
}

export default Home
