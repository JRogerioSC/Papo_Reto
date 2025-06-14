import { useEffect, useState, useRef } from 'react'
import axios from 'axios';
import './style.css'
import Refresh from '../../assets/refresh.svg'
import Trash from '../../assets/trash.svg'
import api from '../../services/api'

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

      <button className='refresh' onClick={() => window.location.reload()}>
        <img src={Refresh} alt='Recarregar' />
      </button>
    </div>
  )
}




function ChatComponent() {
  const [mensagens, setMensagens] = useState([]);
  const fimDoChatRef = useRef(null);

  // Buscar mensagens da API
  useEffect(() => {
    const buscarMensagens = async () => {
      const res = await axios.get('localhost:3001/usuarios');
      setMensagens(res.data);
    };

    buscarMensagens();

    // Opcional: auto atualização a cada 5 segundos
    const intervalo = setInterval(buscarMensagens, 5000);
    return () => clearInterval(intervalo);
  }, []);

  // Scroll automático sempre que mensagens mudarem
  useEffect(() => {
    fimDoChatRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  return (
    <div style={{ height: '400px', overflowY: 'auto', border: '1px solid #ccc', padding: '1rem' }}>
      {mensagens.map((msg) => (
        <div key={msg.id}>
          <strong>{msg.name}:</strong> {msg.menssage}
        </div>
      ))}
      <div ref={fimDoChatRef} />
    </div>
  );

}


export default Home;