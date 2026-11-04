import app from './app.js'

const port = process.env.PORT || 5000

app.listen(port, () => {
  console.log(`StockFlow API listening on port ${port}`)
})
