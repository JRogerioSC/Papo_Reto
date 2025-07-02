import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { io } from 'socket.io-client'
import './style.css'

const socket = io('https://seu-backend-na-render.onrender.com') // altere para o seu backend

function App() {
  const [messages, setMessages] = useState([])
  const [author, setAuthor] = useState('')
  const [content, setContent] = useState('')
  const [media, setMedia] = useState(null)
  const [mediaType, setMediaType] = useState('')
  const mediaRecorderRef = useRef(null)
  const [gravando, setGravando] = useState(false)

  useEffect(() => {
    axios.get('https://seu-backend-na-render.onrender.com/mensagens').then(res => {
      setMessages(res.data)
    })

    socket.on('nova_mensagem', msg => {
      setMessages(prev => [...prev, msg])
    })

    return () => socket.off('nova_mensagem')
  }, [])

  const enviarMensagem = async () => {
    if (!author) return alert('Informe seu nome')

    const form = new FormData()
    form.append('author', author)
    form.append('content', content)
    form.append('type', media ? mediaType : 'text')
    if (media) form.append('media', media)

    await axios.post('https://seu-backend-na-render.onrender.com/mensagem', form)
    setContent('')
    setMedia(null)
    setMediaType('')
  }

  const selecionarArquivo = (e, tipo) => {
    const file = e.target.files[0]
    if (file) {
      setMedia(file)
      setMediaType(tipo)
    }
  }

  const iniciarGravacao = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    mediaRecorderRef.current = recorder
    const chunks = []

    recorder.ondataavailable = e => chunks.push(e.data)
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' })
      const file = new File([blob], 'audio.webm', { type: 'audio/webm' })
      setMedia(file)
      setMediaType('audio')
    }

    recorder.start()
    setGravando(true)
  }

  const pararGravacao = () => {
    mediaRecorderRef.current?.stop()
    setGravando(false)
  }

  return (
    <div className="app">
      <h2>Papo_Reto</h2>
      <input
        placeholder="Seu nome"
        value={author}
        onChange={e => setAuthor(e.target.value)}
      />

      <div className="chat">
        {messages.map(msg => (
          <div key={msg.id} className="msg">
            <strong>{msg.author}:</strong>
            {msg.content && <p>{msg.content}</p>}
            {msg.media && msg.type === 'image' && <img src={msg.media} alt="imagem" width="200" />}
            {msg.media && msg.type === 'video' && <video src={msg.media} controls width="200" />}
            {msg.media && msg.type === 'audio' && <audio src={msg.media} controls />}
          </div>
        ))}
      </div>

      <textarea
        placeholder="Digite sua mensagem"
        value={content}
        onChange={e => setContent(e.target.value)}
      />

      <div>
        <input type="file" accept="image/*" onChange={e => selecionarArquivo(e, 'image')} />
        <input type="file" accept="video/*" onChange={e => selecionarArquivo(e, 'video')} />
        {!gravando ? (
          <button onClick={iniciarGravacao}>🎙️ Gravar áudio</button>
        ) : (
          <button onClick={pararGravacao}>🛑 Parar</button>
        )}
        <button onClick={enviarMensagem}>Enviar</button>
      </div>
    </div>
  )
}

export default App

