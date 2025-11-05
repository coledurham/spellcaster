const path = require('path')

module.exports = (app) => {

  app.get('/', (_, res) => {
    console.log('in / path to return ' + path.join(__dirname, '../index.html'))
    res.sendFile(path.join(__dirname, '../index.html'))
  })

  // Put additionanl paths between here; do not need to add js or css paths here
  app.get('/{*splat}', (_, res) => {
    console.log('in * catch all to return 200 with error message')
    res.send("ERROR: Unsupported path")
  })
}
