const express = require('express')
const path = require('path')

const routes = require('./routes/index')

const app = express()

app.use("/css", express.static(path.join(__dirname, "public/css")))
app.use("/scripts", express.static(path.join(__dirname, "public/js")))
app.use("/assets", express.static(path.join(__dirname, "public/assets")))

routes(app)

app.listen(3000)

module.exports = app
