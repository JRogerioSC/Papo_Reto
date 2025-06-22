import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import './style.css'
import Refresh from '../../assets/refresh.svg'
import api from '../../services/api'

const PUBLIC_VAPID_KEY = 'BCDQq4OUvCl6IS2j7X0PJuMwvUT8wFT5Nb6i5WZ0Q8ojL_gKNxEoyH3wsxuCX2AV7R4RyalvZlk11FPz_tekPuY'

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

  async function getUsers() {
    try {
      const res = await axios.get('https://api-papo-reto.onrender.com/usuarios')
      setUsers(res.data)
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error)
    }
  }

  async function createUsers() {
    const name = inputName.current.value.trim()
    const menssage = inputMenssage.current.value.trim()

    if (name && menssage) {
      try {
        await axios.post('https://api-papo-reto.onrender.com/usuarios', {
          name,
          menssage
        })
      } catch (error) {
        console.error('Erro ao criar usuário:', error)
      }

      inputMenssage.current.value = ''
      getUsers()
    } else {
      alert('Preencha todos os campos antes de enviar.')
    }
  }

  async function deleteUsers(id) {
    try {
      await axios.delete(`https://api-papo-reto.onrender.com/usuarios/${id}`)
      getUsers()
    } catch (error) {
      console.error('Erro ao deletar mensagem:', error)
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
        await axios.post('https://api-papo-reto.onrender.com/subscribe', subscription)
      } catch (error) {
        console.error('Erro ao se inscrever para notificações:', error)
      }
    }
  }

  useEffect(() => {
    getUsers()
    subscribeToPush()

    const interval = setInterval(getUsers, 3000) // Atualiza a cada 3s
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [users])

  return (
    <div className='container'>
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

      <button className='refresh' onClick={getUsers}>
        <img src={Refresh} alt='Recarregar' />
      </button>
    </div>
  )
}

export default Home

