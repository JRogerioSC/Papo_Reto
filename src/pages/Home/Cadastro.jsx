import { useState } from 'react'
import axios from 'axios'

const BACKEND_URL = 'https://api-papo-reto.onrender.com'

function Cadastro({ onCadastro }) {
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function cadastrar() {
        const nome = name.trim()
        if (!nome) return

        try {
            setLoading(true)
            setError('')

            // 🔎 tenta validar o usuário EXISTENTE
            const res = await axios.post(`${BACKEND_URL}/usuarios`, {
                name: nome,
                menssage: ' ' // ⚠️ força backend a NÃO criar mensagem
            })

            if (!res.data?.id || !res.data?.name) {
                throw new Error('Usuário inválido')
            }

            // ✅ usuário validado
            localStorage.setItem('papo_reto_nome', res.data.name)
            onCadastro(res.data.name)
        } catch (err) {
            setError('Usuário não encontrado. Cadastre um nome válido.')
            localStorage.removeItem('papo_reto_nome')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="cadastro">
            <h2>Digite seu nome</h2>

            <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Seu nome"
                disabled={loading}
            />

            {error && <span className="erro">{error}</span>}

            <button onClick={cadastrar} disabled={loading}>
                {loading ? 'Verificando...' : 'Entrar'}
            </button>
        </div>
    )
}

export default Cadastro
