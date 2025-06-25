import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import './style.css'
import { io } from 'socket.io-client'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { register } from './serviceWorkerRegistration'

register()

const PUBLIC_VAPID_KEY = 'BCDQq4OUvCl6IS2j7X0PJuMwvUT8wFT5Nb6i5WZ0Q8ojL_gKNxEoyH3wsxuCX2AV7R4RyalvZlk11FPz_tekPuY'
const ICON_URL = 'https://i.postimg.cc/6pfxh8tJ/512x512.jpg'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
}

function Home() {
  const [users, setUsers] = useState([])
  const inputName = useRef()
  const inputMenssage = useRef()
  const scrollRef = useRef()
  const socketRef = useRef(null)

  const BACKEND_URL = 'https://api-papo-reto.onrender.com'

  async function getUsers() {
    try {
      const res = await axios.get(`${BACKEND_URL}/usuarios`)
      setUsers(res.data)
    } catch (err) {
      console.error('Erro ao buscar mensagens:', err)
    }
  }

  async function createUsers() {
    const name = inputName.current.value.trim()
    const menssage = inputMenssage.current.value.trim()

    if (name && menssage) {
      try {
        await axios.post(`${BACKEND_URL}/usuarios`, { name, menssage })

        toast.success('📨 Mensagem enviada com sucesso!', {
          position: 'top-center',
          autoClose: 3000,
          theme: 'colored'
        })

      } catch (error) {
        console.error('Erro ao criar usuário:', error)
        toast.error('❌ Erro ao enviar mensagem.', {
          position: 'top-center',
          autoClose: 3000,
          theme: 'colored'
        })
      }

      inputMenssage.current.value = ''
      getUsers()
    } else {
      toast.warning('⚠️ Preencha todos os campos antes de enviar.', {
        position: 'top-center',
        autoClose: 3000
      })
    }
  }

  async function deleteUsers(id) {
    try {
      await axios.delete(`${BACKEND_URL}/usuarios/${id}`)
      getUsers()
    } catch (err) {
      console.error('Erro ao deletar mensagem:', err)
    }
  }

  async function subscribeToPush() {
    if ('serviceWorker' in navigator) {
      try {
        const register = await navigator.serviceWorker.register('/sw.js')
        const subscription = await register.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
        })
        await axios.post(`${BACKEND_URL}/subscribe`, subscription)
      } catch (error) {
        console.error('Erro ao inscrever para push:', error)
      }
    }
  }

  useEffect(() => {
    getUsers()
    subscribeToPush()

    socketRef.current = io(BACKEND_URL)

    socketRef.current.on('connect', () => {
      const nome = inputName.current?.value || 'visitante'
      socketRef.current.emit('register', nome)
    })

    socketRef.current.on('nova_mensagem', msg => {
      toast.info(`💬 ${msg.name}: ${msg.menssage}`, {
        icon: () => (
          <img
            src={ICON_URL}
            alt="Icon"
            style={{ width: 24, height: 24, borderRadius: 4 }}
          />
        ),
        autoClose: 4000,
        position: 'top-center',
        theme: 'light'
      })

      getUsers()
    })

    const interval = setInterval(() => {
      getUsers()
    }, 2000)

    return () => {
      socketRef.current?.disconnect()
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [users])

  return (
    <div className='container'>
      <ToastContainer />
      <h1>Papo_Reto</h1>

      {users.map(user => (
        <div key={user.id} className='card'>
          <div>
            <span><p># {user.name} # :</p></span>
            <span>{user.menssage}</span>
          </div>
          <button onClick={() => deleteUsers(user.id)}>🗑</button>
        </div>
      ))}

      <div ref={scrollRef}></div>

      <form>
        <input className='nome' ref={inputName} placeholder='Nome' />
        <input className='menssage' ref={inputMenssage} placeholder='Mensagem' />
      </form>

      <button className='enviar' onClick={createUsers}>ENVIAR</button>
    </div>
  )
}

export default Home
