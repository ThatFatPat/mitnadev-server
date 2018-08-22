const express = require('express')
const session = require('express-session') // this will be used to remember logged in users

const app = express()

app.use(session({
    secret: 'L6Q6tn#zaHZ7W35E*Idks4bgkz',
    resave: true,
    saveUninitialized: false,
    cookie: {
        httpOnly: true // javascript client can't see document.cookie to get the session id
    }
}))


const api = express()

/**
 * This will be used to login (get user information)
 */
api.post('/user', (req, res) => {
    username = req.body.username
    password = req.body.password
    rememberMe = req.body.rememberMe
    // API CALL HERE TO FETCH THE PASSWORD HASH THEN COMPARE THE HASHES AND RETURN THE INFO
    data = { id: "yahoo", token: "secret", type: 0, name: "lolik"}
    if (rememberMe)
        req.session.token = data.token // Saves login server side
    res.json(data)
})

api.post('/logout', (req, res) => {
    if (req.session.token) {
        req.session.token = null // removes login from 
        res.json({ successful: true })
    } else {
        res.status(401).json({ successful: false })
    }
})

api.get('/headers', (req, res) => {
    if (!!req.get('Authorization')) {
        // CHECK INTEGRITY OF USER WITH THAT TOKEN IF IT IS INVALID RETURN
    } else if (!!req.session.token) {
        // CHECK INTEGRITY OF USER WITH THAT TOKEN IF IT IS INVALID RETURN
    } else {
        res.status(401).json({ headers: [] })
    }
    // might need api call to fetch headers
    res.json({ headers: [['שם פרטי', 'first'], ['שם משפחה', 'last'], ['אני לא יודע', 'hand']] })
})

api.get('/studentdata', (req, res) =>  {
    if (!!req.get('Authorization')) {
        // CHECK INTEGRITY OF USER WITH THAT TOKEN IF IT IS INVALID RETURN
    } else if (!!req.session.token) {
        // CHECK INTEGRITY OF USER WITH THAT TOKEN IF IT IS INVALID RETURN
    } else {
        res.status(401).json({ data: [] })
    }
    res.json({ data: [
        { key: 12, first: 'Oded', last: 'Shapira', hand: 'I am not sure' },
        { key: 15, first: 'Ido', last: 'Shavit', hand: 'Please' },
        { key: 17, first: 'Nir', last: 'Shahar', hand: 'ree' },
        { key: 18, first: 'Noa', last: 'Shapira', hand: 'pool' }
      ]
    })
})


app.use('/api', api)
app.listen(3000)