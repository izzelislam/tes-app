const express = require('express')
const socketIO = require('socket.io')
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const http = require('http')
const path = require('path')
const fs   = require('fs')

const { phoneNumberFormater } = require('./helpers/formater')

const app = express()
const server = http.createServer(app)
const io = socketIO(server)

const SESSION_FILE_PATH = './session.json';

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

// Load the session data if it has been previously saved
let sessionData;
if(fs.existsSync(SESSION_FILE_PATH)) {
    sessionData = require(SESSION_FILE_PATH);
}

// Use the saved values
const client = new Client({
  // restartOnAuthFail: true,
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // <- this one doesn't works in Windows
      '--disable-gpu'
    ],
  },
  session: sessionData
});

client.on('message', msg => {
  if (msg.body == '!ping') {
      msg.reply('pong');
  }
});

io.on('connection', (socket) => {
  socket.emit('message', 'connected..')

  client.on('qr', (qr) => {
      // Generate and scan this code with your phone
      console.log('QR RECEIVED', qr);
      // qrcode.generate(qr)
      qrcode.toDataURL(qr, (err, url) => {
        socket.emit('qr', url)
        socket.emit('message', 'silahkan scan qr code.')
      })
  });

  client.on('ready', () => {
      console.log('Client is ready!');
      socket.emit('ready', 'whatsapp sudah siap')
      socket.emit('message', 'whatsapp sudah siap')
  });

  client.on('authenticated', (session) => {
    socket.emit('authenticated', 'whatsapp authenticeted')
    socket.emit('message', 'whatsapp authenticeted')
    sessionData = session;
    fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), (err) => {
        if (err) {
            console.error(err);
        }
    });
  });

})

client.initialize();

const registerNumber = async (number) => {
  const isRegistered= await client.isRegisteredUser(number)
  return isRegistered
}

// route

app.get('/', (req, res) => {
  res.render('page')
})

app.post('/send-message', async (req, res) => {
  const number = phoneNumberFormater(req.body.number)
  const message = req.body.message

  const isRegisteredNumber = await registerNumber(number)

  if(!isRegisteredNumber) {
    return res.status(422).json({
      status: false,
      message: 'nomor belum terdaftar'
    })
  }

  client.sendMessage(number, message)
        .then(response => res.status(200).json({
          status : true,
          data   : response
        }))
        .catch( err => {
          res.status(500).json({
            status: true,
            data  : err
          })
        })
})

server.listen(3000, () => {
  console.log('listen on port 3000')
})