import axios from 'axios'

const api = axios.create({
    baseURL: 'https://api-papo-reto.onrender.com'
})

export default api