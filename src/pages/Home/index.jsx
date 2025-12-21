import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import webpush from 'web-push'
import http from 'http'
import { Server } from 'socket.io'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const prisma = new PrismaClient()
const app = express()

// =====================
// 🔐 VAPID KEYS
// =====================
const vapidKeys = {
  publicKey: 'BCDQq4OUvCl6IS2j7X0PJuMwvUT8wFT5Nb6i5WZ0Q8ojL_gKNxEoyH3wsxuCX2AV7R4RyalvZlk11FPz_tekPuY',
  privateKey: 'hKMev5kvTyICm1lybTzBE5HJNEJnVxgwDnlsN7B6H5M'
}

webpush.setVapidDetails(
  'mailto:admin@pap0reto.net',
  vapidKeys.publicKey,
  vapidKeys.privateKey
)

// =====================
// 🌐 CORS + JSON
// =====================
app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

// =====================
// 📂 UPLOADS (ÁUDIO)
// =====================
const uploadDir = path.resolve('uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir)

app.use('/uploads', express.static(uploadDir))

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}-${Math.random()}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
})

// =====================
// 🔌 HTTP + SOCKET.IO
// =====================
const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: true, methods: ['GET', 'POST', 'DELETE'] }
})

// =====================
// 📦 PUSH SUBSCRIPTIONS
// =====================
const subscriptions = []

// =====================
// 🔗 SOCKET USERS ONLINE
// =====================
const userSockets = new Map()

io.on('connection', socket => {
  socket.on('register', name => {
    if (name) userSockets.set(name.toLowerCase(), socket.id)
  })

  socket.on('disconnect', () => {
    for (const [name, id] of userSockets.entries()) {
      if (id === socket.id) userSockets.delete(name)
    }
  })
})

// =====================
// 🔔 SUBSCRIBE PUSH
// =====================
app.post('/subscribe', (req, res) => {
  const { subscription, name } = req.body
  if (!subscription || !name) return res.status(400).json({ error: 'Dados inválidos' })

  const exists = subscriptions.some(s => s.subscription.endpoint === subscription.endpoint)
  if (!exists) subscriptions.push({ name: name.toLowerCase(), subscription })

  res.status(201).json({ ok: true })
})

// =====================
// 👤 CADASTRAR USUÁRIO (OU IGNORAR SE JÁ EXISTIR)
// =====================
app.post('/usuarios', async (req, res) => {
  const { name, menssage } = req.body

  if (!name?.trim()) {
    return res.status(400).json({ error: 'Nome obrigatório' })
  }

  const normalized = name.trim().toLowerCase()

  let user = await prisma.user.findFirst({
    where: { name: { equals: normalized, mode: 'insensitive' } }
  })

  // 👉 SE NÃO EXISTIR, CRIA O USUÁRIO
  if (!user) {
    user = await prisma.user.create({
      data: { name: normalized }
    })
  }

  // 👉 SE NÃO VEIO MENSAGEM, É SÓ CADASTRO
  if (!menssage || !menssage.trim()) {
    return res.status(201).json({
      id: user.id,
      name: user.name,
      created: true
    })
  }

  // 👉 SE VEIO MENSAGEM, SALVA
  const message = await prisma.message.create({
    data: {
      text: menssage.trim(),
      mediaType: 'text',
      userId: user.id
    }
  })

  const payload = {
    id: message.id,
    text: message.text,
    mediaType: 'text',
    name: user.name,
    createdAt: message.createdAt
  }

  io.emit('nova_mensagem', payload)

  sendNotification({
    title: `Nova mensagem de ${user.name}`,
    body: message.text,
    url: 'https://pap0reto.netlify.app'
  })

  res.status(201).json(payload)
})

// =====================
// 🔎 VALIDAR USUÁRIO
// =====================
// =====================
// 🔎 VALIDAR USUÁRIO (EXISTE?)
// =====================
app.get('/usuarios/validar/:name', async (req, res) => {
  const { name } = req.params

  if (!name?.trim()) {
    return res.status(400).json({ exists: false })
  }

  const user = await prisma.user.findFirst({
    where: {
      name: {
        equals: name.trim().toLowerCase(),
        mode: 'insensitive'
      }
    }
  })

  if (!user) {
    return res.status(404).json({ exists: false })
  }

  res.json({ exists: true })
})


// =====================
// 💬 ENVIAR TEXTO
// =====================
app.post('/usuarios', async (req, res) => {
  const { name, menssage } = req.body
  if (!name?.trim() || !menssage?.trim()) {
    return res.status(400).json({ error: 'Nome e mensagem obrigatórios' })
  }

  const normalized = name.trim().toLowerCase()

  const user = await prisma.user.findFirst({
    where: { name: { equals: normalized, mode: 'insensitive' } }
  })
  if (!user) return res.status(400).json({ error: 'Usuário não cadastrado' })

  const message = await prisma.message.create({
    data: {
      text: menssage.trim(),
      mediaType: 'text',
      userId: user.id
    }
  })

  const payload = {
    id: message.id,
    text: message.text,
    mediaType: 'text',
    name: user.name,
    createdAt: message.createdAt
  }

  io.emit('nova_mensagem', payload)
  sendNotification({
    title: `Nova mensagem de ${user.name}`,
    body: message.text,
    url: 'https://pap0reto.netlify.app'
  })

  res.status(201).json(payload)
})

// =====================
// 🎙 ENVIAR ÁUDIO
// =====================
app.post('/usuarios/audio', upload.single('audio'), async (req, res) => {
  const { name } = req.body
  if (!req.file || !name) {
    return res.status(400).json({ error: 'Áudio e nome obrigatórios' })
  }

  const normalized = name.trim().toLowerCase()

  const user = await prisma.user.findFirst({
    where: { name: { equals: normalized, mode: 'insensitive' } }
  })
  if (!user) return res.status(400).json({ error: 'Usuário não cadastrado' })

  const audioUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`

  const message = await prisma.message.create({
    data: {
      mediaUrl: audioUrl,
      mediaType: 'audio',
      userId: user.id
    }
  })

  const payload = {
    id: message.id,
    mediaUrl: audioUrl,
    mediaType: 'audio',
    name: user.name,
    createdAt: message.createdAt
  }

  io.emit('nova_mensagem', payload)
  sendNotification({
    title: `🎙 Áudio de ${user.name}`,
    body: 'Mensagem de áudio',
    url: 'https://pap0reto.netlify.app'
  })

  res.status(201).json(payload)
})

// =====================
// 📥 LISTAR MENSAGENS
// =====================
app.get('/usuarios', async (req, res) => {
  const mensagens = await prisma.message.findMany({
    include: { user: true },
    orderBy: { createdAt: 'asc' }
  })

  res.json(
    mensagens.map(m => ({
      id: m.id,
      text: m.text,
      mediaUrl: m.mediaUrl,
      mediaType: m.mediaType,
      name: m.user.name,
      createdAt: m.createdAt
    }))
  )
})

// =====================
// 🗑 APAGAR MENSAGEM
// =====================
app.delete('/usuarios/:id', async (req, res) => {
  const { id } = req.params
  const { name } = req.body

  const message = await prisma.message.findUnique({
    where: { id },
    include: { user: true }
  })

  if (!message) return res.sendStatus(404)
  if (message.user.name.toLowerCase() !== name.toLowerCase()) {
    return res.status(403).json({ error: 'Não autorizado' })
  }

  await prisma.message.delete({ where: { id } })
  io.emit('mensagem_apagada', id)
  res.sendStatus(204)
})

// =====================
// 🔔 PUSH OFFLINE
// =====================
function sendNotification(msg) {
  for (const sub of subscriptions) {
    if (userSockets.has(sub.name)) continue
    webpush.sendNotification(
      sub.subscription,
      JSON.stringify({
        title: msg.title,
        body: msg.body,
        data: { url: msg.url }
      })
    ).catch(() => { })
  }
}

// =====================
// 🚀 START SERVER
// =====================
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`🔥 API rodando na porta ${PORT}`)
})
