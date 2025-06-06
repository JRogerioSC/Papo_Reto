import { useEffect, useState, useRef } from 'react'
import './style.css'
import Trash from '../../assets/trash.svg'
import api from '../../services/api'

function Home() {
  const [users, setUsers] = useState([])

  const inputName = useRef()
  const inputMenssage = useRef()

  const scrollScreen = () => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth"
    })
  }

  async function getUsers() {

    const usersFromApi = await api.get('/usuarios')

    setUsers(usersFromApi.data)

  }

  async function createUsers() {
    await api.post('/usuarios', {
      name: inputName.current.value,
      menssage: inputMenssage.current.value
    })

    getUsers()

  }

  async function deleteUsers(id) {
    await api.delete(`/usuarios/${id}`)

    getUsers()

  }

  useEffect(() => {
    getUsers()

  }, [])

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
            <img src={Trash} />
          </button>
        </div>
      ))}

      <form>

        <input placeholder='Nome' className='nome' name="nome" type='text' ref={inputName} />

        <input placeholder='Menssagem' className='menssage' name="menssagem" type='text' ref={inputMenssage} />


      </form>

      <button className='enviar' type='button' onClick={createUsers}>ENVIAR</button>




    </div>


  )

}



export default Home