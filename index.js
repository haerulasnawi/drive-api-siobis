const express = require('express')
const app = express()
const port = 5000
const index = require('./routes')

app.use(express.json({limit: '500kb'}))
app.use(express.urlencoded({ extended: true }))
app.use('/api/drive', index)

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

