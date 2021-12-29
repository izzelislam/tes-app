const express = require('express')

const app = express()

app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.get('/', (req, res) => {
  res.status(200).json({
    status: true,
    data: ' success running'
  })
})


app.listen(3000, () => {
  console.log('listen on port 3000')
})