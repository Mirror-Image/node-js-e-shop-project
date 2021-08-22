const express = require('express')
require('dotenv/config')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const mongoose = require('mongoose')
const cors = require('cors')
const usersRouter = require('./routers/users')
const productsRouter = require('./routers/products')
const ordersRouter = require('./routers/orders')
const categoriesRouter = require('./routers/categories')
const authJwt = require('./helpers/jwt')
const errorHandler = require('./helpers/error-handler')

const app = express()

const api = process.env.API_URL

app.use(cors())
app.options('*', cors())

// middleware
app.use(bodyParser.json())
app.use(morgan('tiny'))
app.use(authJwt())
app.use('/public/uploads', express.static(__dirname + '/public/uploads'))
app.use(errorHandler)

// Routers
app.use(`${api}/categories`, categoriesRouter)
app.use(`${api}/products`, productsRouter)
app.use(`${api}/users`, usersRouter)
app.use(`${api}/orders`, ordersRouter)

mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    dbName: 'e-shop-database',
})
    .then(() => {
        console.log('Database was connected')
    })
    .catch(console.log)

app.listen(3000, () => {
    console.log('The server is running on the port 3000')
});
