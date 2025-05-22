import './style.css'
import Trash from '../../assets/trash.svg'


function Home() {

  const users = [{
    id: '0000066677788',
    name:'Rogerio',
    menssage: 'blablabla'
  },
  {
    id: '0000066677733',
    name:'Mario',
    menssage: 'blobloblo'
  },
   {id: '0000066677755',
    name:'Joao',
    menssage: 'bliblibli'
   }
  ]


  return (

    <div className='container'>

      <h1>Papo_Reto</h1>

      {users.map((user) => (
        <div key={user.id}className='card'>
          <div>
            <p>Nome: <span>{user.name}</span></p>
            <p>Menssagem: <span>{user.menssage}</span></p>
          </div>
          <button>
            <img src={Trash} />
          </button>
        </div>
      ))}

      <form>

        <input placeholder='Nome' className='nome' name="nome" type='text' />

        <input placeholder='Menssagem' className='menssage' name="menssagem" type='text' />

        <button type='button'>ENVIAR</button>

      </form>

      
    </div>
  )
}



export default Home