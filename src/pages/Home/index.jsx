import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import './style.css'
import { io } from 'socket.io-client'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { register } from './serviceWorkerRegistration'

register()

const BACKEND_URL = 'https://api-papo-reto.onrender.com'

function Home() {
  const [messages, setMessages] = useState([])
  const [name, setName] = useState('')
  const [cadastrado, setCadastrado] = useState(false)
  const [conectando, setConectando] = useState(true)

  // 🎙️ ÁUDIO
  const [gravando, setGravando] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  const inputName = useRef(null)
  const inputMessage = useRef(null)
  const scrollRef = useRef(null)
  const socketRef = useRef(null)

  function capitalizarNome(nome) {
    return nome.charAt(0).toUpperCase() + nome.slice(1).toLowerCase()
  }

  async function iniciarGravacao() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = e => {
        audioChunksRef.current.push(e.data)
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm'
        })

        console.log('🎧 Áudio gravado:', audioBlob)
        toast.success('Áudio gravado! (pronto para enviar)')
        // 👉 NO PRÓXIMO PASSO vamos enviar pro backend
      }

      mediaRecorderRef.current.start()
      setGravando(true)
    } catch {
      toast.error('Permissão de microfone negada')
    }
  }

  function pararGravacao() {
    mediaRecorderRef.current.stop()
    setGravando(false)
  }

  async function enviarMensagem() {
    const text = inputMessage.current.value.trim()
    if (!text) return

    await axios.post(`${BACKEND_URL}/usuarios`, {
      name,
      menssage: text
    })

    inputMessage.current.value = ''
  }

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (conectando) {
    return <div className="loading"><div className="spinner" /></div>
  }

  return (
    <div className="container">
      <ToastContainer />

      <div className="chat">
        {messages.map(msg => (
          <div key={msg.id} className="message-wrapper mine">
            <div className="bubble-row">
              <div className="card mine">
                <span className="text">{msg.text}</span>
              </div>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* 🔽 INPUT + ÁUDIO */}
      <div className="input-area">
        <input
          ref={inputMessage}
          className="menssage"
          placeholder="Digite sua mensagem"
          onKeyDown={e => e.key === 'Enter' && enviarMensagem()}
        />

        {!gravando ? (
          <button className="enviar" onClick={iniciarGravacao}>🎤</button>
        ) : (
          <button className="enviar" onClick={pararGravacao}>⏹</button>
        )}

        <button className="enviar" onClick={enviarMensagem}>
          ➤
        </button>
      </div>
    </div>
  )
}

export default Home
