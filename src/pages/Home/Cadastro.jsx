import { useState } from 'react'
import axios from 'axios'

const BACKEND_URL = 'https://api-papo-reto.onrender.com'

function Cadastro({ onCadastro }) {
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [naoExiste, setNaoExiste] = useState(false)

    async function entrar() {
        const nome = name.trim()
        if (!nome) return

        try {
            setLoading(true)
            setError('')
            setNaoExiste(false)

            const res = await axios.post(`${BACKEND_URL}/usuarios/validar`, {
                name: nome
            })

            if (typeof onCadastro === 'function') {
                localStorage.setItem('papo_reto_nome', res.data.name)
                onCadastro(res.data.name)
            }
        } catch (err) {
            if (err.response?.status === 404) {
                setNaoExiste(true)
                setError('Usuário não encontrado')
            } else {
                setError('Erro ao validar usuário')
            }
        } finally {
            setLoading(false)
        }
    }

    async function cadastrar() {
        const nome = name.trim()
        if (!nome) return

        try {
            setLoading(true)
            setError('')

            const res = await axios.post(`${BACKEND_URL}/usuarios/cadastrar`, {
                name: nome
            })

            if (typeof onCadastro === 'function') {
                localStorage.setItem('papo_reto_nome', res.data.name)
                onCadastro(res.data.name)
            }
        } catch (err) {
            if (err.response?.status === 409) {
                setError('Nome já está em uso')
            } else {
                setError('Erro ao cadastrar usuário')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="cadastro">
            <h2>Digite seu nome</h2>

            <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Seu nome"
                disabled={loading}
            />

            {error && <span className="erro">{error}</span>}

            {!naoExiste && (
                <button onClick={entrar} disabled={loading}>
                    {loading ? 'Verificando...' : 'Entrar'}
                </button>
            )}

            {naoExiste && (
                <button onClick={cadastrar} disabled={loading}>
                    {loading ? 'Cadastrando...' : 'Cadastrar'}
                </button>
            )}
        </div>
    )
}

export default Cadastro
