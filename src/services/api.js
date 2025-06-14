import axios from 'axios'

const api = axios.create({
   baseURL: 'localhost:3001/usuarios'
})

export default api