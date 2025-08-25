import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import './style.css'
import { io } from 'socket.io-client'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { register } from './serviceWorkerRegistration'

register()

const PUBLIC_VAPID_KEY = 'BCDQq4OUvCl6IS2j7X0PJuMwvUT8wFT5Nb6i5WZ0Q8ojL_gKNxEoyH3wsxuCX2AV7R4RyalvZlk11FPz_tekPuY'
const ICON_URL = 'https://i.postimg.cc/k499mWs5/Chat-GPT-Image-23-de-jun-de-2025-21-00-52.png'
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
      toast.warning('⚠️ Digite um nome válido para cadastro.', { autoClose: 3000, position: 'top-center' })
      return
    }

    try {
      await axios.post(`${BACKEND_URL}/usuarios/cadastrar`, { name: nome })
      toast.success(`✅ Nome "${nome}" cadastrado com sucesso!`, { autoClose: 2000, position: 'top-center' })
      localStorage.setItem('username', nome)
      setName(nome)
      setCadastrado(true)
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro no cadastro do nome.'
      toast.error(`❌ ${msg}`, { autoClose: 3000, position: 'top-center' })
    }
  }

  async function enviarMensagem() {
    const menssage = inputMenssage.current.value.trim()
    if (!name) {
      toast.warning('⚠️ Cadastre seu nome antes de enviar mensagens.', { autoClose: 3000, position: 'top-center' })
      return
    }
    if (!menssage) {
      toast.warning('⚠️ Digite uma mensagem.', { autoClose: 3000, position: 'top-center' })
      return
    }

    try {
      await axios.post(`${BACKEND_URL}/usuarios`, { name, menssage })
      toast.success('📨 Mensagem enviada com sucesso!', { autoClose: 2000, position: 'top-center', theme: 'colored' })
      inputMenssage.current.value = ''
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro ao enviar mensagem.'
      toast.error(`❌ ${msg}`, { autoClose: 3000, position: 'top-center', theme: 'colored' })
    }

    getUsers()
  }

  function trocarNome() {
    localStorage.removeItem('username')
    setName('')
    setCadastrado(false)
  }

  async function deleteUsers(id) {
    try {
      await axios.delete(`${BACKEND_URL}/usuarios/${id}`, {
        data: { name }
      })
      getUsers()
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro ao deletar.'
      toast.error(`❌ ${msg}`, { autoClose: 3000, position: 'top-center' })
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
      const nome = localStorage.getItem('username') || 'visitante'
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

    const interval = setInterval(getUsers, 2000)

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

      {users.map(user => (
        <div key={user.id} className='card'>
          <div>
            <span><p># {user.name} # :</p></span>
            <span>{user.menssage}</span>
          </div>
          {user.name.toLowerCase() === name.toLowerCase() && (
            <button onClick={() => deleteUsers(user.id)}>🗑</button>
          )}
        </div>
      ))}

      <div ref={scrollRef}></div>

      {!cadastrado ? (
        <>
          <input
            className='nome'
            ref={inputName}
            placeholder='Digite seu nome'
            maxLength={20}
          />
          <button className='cadastrar' onClick={cadastrarNome}>CADASTRAR NOME</button>
        </>
      ) : (
        <>
          <p>Nome fixado: <strong>{name}</strong></p>

          <input
            className='menssage'
            ref={inputMenssage}
            placeholder='Digite sua mensagem'
            maxLength={200}
          />
          <button className='enviar' onClick={enviarMensagem}>ENVIAR</button>
        </>
      )}
    </div>
  )
}

export default Home
