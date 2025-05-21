import './style.css'
import Trash from '../../assets/trash.svg'


function Home() {

  const users = [{
    id: '0000066677788',
    name: 'Rogerio',
    menssage: 'blablabla'
  },
  {
    id: '0000066677733',
    name: 'Mario',
    menssage: 'blobloblo'
  }
  ]


  return (

    <div className='container'>

      <form>

        <h1>Papo_Reto</h1>

        <input name="nome" type='text' />

        <input name="menssagem" type='text' />

        <button type='button'>ENVIAR</button>

      </form>

      {users.map((user) => (
        <div key={user.id}>
          <div>
            <p>Nome: {user.name}</p>
            <P>Menssagem: {user.menssage}</P>
          </div>
          <button>
            <img src={Trash} />
          </button>
        </div>
      ))}


    </div>
  )
}



export default Home