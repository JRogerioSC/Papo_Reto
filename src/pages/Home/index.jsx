import { useEffect, useState, useRef } from 'react'
import axios from 'axios';
import WebSocket from 'ws';
import './style.css'
import Refresh from '../../assets/refresh.svg'
import Trash from '../../assets/trash.svg'
import api from '../../services/api'

function Home() {
  const [users, setUsers] = useState([])
  const socketRef = useRef(null)

  const inputName = useRef()
  const inputMenssage = useRef()
  const scrollRef = useRef()

  async function createUsers() {
    await api.post('/usuarios', {
      name: inputName.current.value,
      menssage: inputMenssage.current.value
    })

    inputName.current.value = ''
    inputMenssage.current.value = ''
  }

  async function deleteUsers(id) {
    await api.delete(`/usuarios/${id}`)
  }

  useEffect(() => {
    // Conecta com o WebSocket
    socketRef.current = new WebSocket('wss://api-papo-reto.onrender.com')

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'UPDATE_USERS') {
        setUsers(data.payload)
      }
    }

    // Fecha conexão no unload
    return () => socketRef.current?.close()
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [users])

  return (
    <div className='container'>
      <h1>Papo_Reto</h1>

      {users.map((user) => (
        <div key={user.id} className='card'>
          <div>
            <span><p># {user.name} # :</p></span>
            <span>{user.menssage}</span>
          </div>
          <button onClick={() => deleteUsers(user.id)}>
            <img src={Trash} alt='Excluir' />
          </button>
        </div>
      ))}
      <div ref={scrollRef}></div>

      <form>
        <input
          placeholder='Nome'
          className='nome'
          name='nome'
          type='text'
          ref={inputName}
        />
        <input
          placeholder='Mensagem'
          className='menssage'
          name='menssage'
          type='text'
          ref={inputMenssage}
        />
      </form>

      <button className='enviar' type='button' onClick={createUsers}>
        ENVIAR
      </button>

      <button className='refresh' onClick={() => window.location.reload()}>
        <img src={Refresh} alt='Recarregar' />
      </button>
    </div>
  )
}

export default Home
