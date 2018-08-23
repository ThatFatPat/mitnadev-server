const express = require('express')
const session = require('express-session') // this will be used to remember logged in users
const path = require('path')
const auth = require('./api/authorization')

const app = express()

app.use(session({
    secret: 'L6Q6tn#zaHZ7W35E*Idks4bgkz',
    resave: true,
    saveUninitialized: false,
    cookie: {
        maxAge: 900000,
        httpOnly: true // javascript client can't see document.cookie to get the session id
    }
}))

const api = express()

/**
 * This will be used to authenticate and retrieve user information
 */
api.post('/user', (req, res) => {
    id = req.body.id
    password = req.body.password
    rememberMe = req.body.rememberMe
    const data = await auth.login(id, password)
    if (!data) {
        return
    }
    req.session.token = data.id
    if (rememberMe) {
         req.session.cookie.maxAge = null  // let the cookie live forever
    }
    res.json(data)
})

api.post('/logout', (req, res) => {
    if (req.session.token) {
        req.session.destroy((err)=>{
            req.session = null
        })
        res.json({ successful: true })
    } else {
        res.status(401).json({ successful: false })
    }
})

api.post('/registerteacher', (req, res) => {
    if (req.body.secret !== 'iO2fSA78fS') {
        res.status(401).send("")
        return
    }
    auth.registerTeacher(req.body.id, req.body.name, req.body.password).then(()=>{
        res.status(200).send("")
    }).catch(()=>{
        res.status(400).send("")
    })
})

api.post('/register', (req, res) => {
    auth.registerStudent(req.body.id, req.body.name, req.body.password, req.body.phone, req.body.email, req.body.subject1, req.body.cl).then(()=>{
        res.status(200).send("")
    }).catch(()=>{
        res.status(400).send("")
    })
})

/**
 * Middleware to exclude the non-authorised api calls to authorised api calls 
 */
api.use((req, res, next) => {
    if (req.session.token) {
        const teacherType = ['/headers', '/studentdata']
        const studentType = []
        const user = await auth.getUserInfo(id)
        if (teacherType.includes(req.path) && user.type === 1) {
            next()
        } else if (studentType.includes(req.path) && user.type === 0) {
            next()
        } else {
            res.status(401).json({})
        }
    } else {
        res.status(401).json({})
    }
})

api.get('/headers', (req, res) => {
    // might need api call to fetch headers
    res.json({ headers: [['שם פרטי', 'first'], ['שם משפחה', 'last'], ['אני לא יודע', 'hand']] })
})

api.get('/studentdata', (req, res) =>  {
    res.json({ data: [
        { key: 12, first: 'Oded', last: 'Shapira', hand: 'I am not sure' },
        { key: 15, first: 'Ido', last: 'Shavit', hand: 'Please' },
        { key: 17, first: 'Nir', last: 'Shahar', hand: 'ree' },
        { key: 18, first: 'Noa', last: 'Shapira', hand: 'pool' }
      ]
    })
})


app.use('/api', api)
app.use('/', express.static(path.join(__dirname, 'website')))
app.listen(3000)