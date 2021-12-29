const express = require('express')
const socketIO = require('socket.io')
const http = require('http')
const path = require('path')

const app = express()
const server = http.createServer(app)
const io = socketIO(server)

app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs');

app.get('/tes', (req, res) => {
  res.status(200).json({
    status: true,
    data: ' success running'
  })
})

// socket
io.on('connection', (socket) => {
  socket.emit('message', 'connected')
})

app.get('/', (req, res) => {
  res.render('page')
})


server.listen(3000, () => {
  console.log('listen on port 3000')
})