import { useEffect, useState, useRef } from 'react'
import axios from 'axios';
import './style.css'
import Refresh from '../../assets/refresh.svg'
import Trash from '../../assets/trash.svg'
import api from '../../services/api'
import '../../firebase'

function Home() {
  const [users, setUsers] = useState([])

  const inputName = useRef()
  const inputMenssage = useRef()
  const scrollRef = useRef() // 🔽 Referência para rolar

  async function getUsers() {
    const usersFromApi = await api.get('/usuarios')
    setUsers(usersFromApi.data)
  }

  async function createUsers() {
    await api.post('/usuarios', {
      name: inputName.current.value,
      menssage: inputMenssage.current.value
    })

    inputName.current.value = ''
    inputMenssage.current.value = ''

    getUsers()
  }

  async function deleteUsers(id) {
    await api.delete(`/usuarios/${id}`)
    getUsers()
  }

  useEffect(() => {
    getUsers()
  }, [])

  // 🔁 Rola até a última mensagem sempre que "users" muda
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

      {/* 🔽 Elemento invisível que serve de âncora para o scroll */}
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

      <button className='refresh' onClick={getUsers}>
        <img src={Refresh} alt='Recarregar' />
      </button>

    </div>
  )

}


export default Home;