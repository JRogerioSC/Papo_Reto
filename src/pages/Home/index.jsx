import { useEffect, useState, useRef } from 'react'
import axios from 'axios';
import './style.css'
import Refresh from '../../assets/refresh.svg'
import Trash from '../../assets/trash.svg'
import api from '../../services/api'
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

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

  // Import the functions you need from the SDKs you need
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyA9yFDYtrt4vDBSiA2rv4F0FsMUddQCpUE",
    authDomain: "paporeto-a7727.firebaseapp.com",
    projectId: "paporeto-a7727",
    storageBucket: "paporeto-a7727.firebasestorage.app",
    messagingSenderId: "952785633903",
    appId: "1:952785633903:web:09c0b6eef083ffca3f039a",
    measurementId: "G-JLX5JEWWEY"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);

}


export default Home;