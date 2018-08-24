const express = require('express')
const session = require('express-session') // this will be used to remember logged in users
const asyncHandler = require('express-async-handler') // async baby
const path = require('path')
const auth = require('./api/authorization')
const MySQLStore = require('express-mysql-session')(session) // this will remember logged in users and save it in mysql
const connection = require('./api/database').connection
const cors = require('cors')
const store = new MySQLStore({}, connection)

const app = express()

app.use(session({
    secret: 'hewo',
    resave: false,
    store,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        httpOnly: true, 
        secure: false,
        maxAge: 86400000
    }
}))

app.use(express.json())

const api = express()

app.use('*', cors({
    origin: 'http://localhost:8080',
    credentials: true
}))

api.use('*', (req, res, next) => {
    Promise.resolve(next()).catch(next)
})

/**
 * This will be used to authenticate and retrieve user information
 */
api.post('/user', async (req, res) => {
    id = req.body.id
    password = req.body.password
    rememberMe = req.body.rememberMe
    const data = await auth.login(id, password)
    if (!data) {
        res.status(400).json({})
        return
    }
    req.session.token = data.id
    if (!rememberMe) {
            req.session.cookie.maxAge = 900000
    }
    res.json(data)
})

api.post('/logout', (req, res) => {
    req.session.destroy()
    res.sendStatus(200)
})

api.post('/registerteacher', (req, res) => {
    if (req.body.secret !== 'iO2fSA78fS') {
        res.sendStatus(401)
        return
    }
    auth.registerTeacher(req.body.id, req.body.name, req.body.password).then(()=>{
        res.sendStatus(200)
    }).catch((err)=>{
        res.status(400).send({error: err.message})
    })
})

api.post('/register', (req, res) => {
    auth.registerStudent(req.body.id, req.body.name, req.body.password, req.body.phone, req.body.email, req.body.subject1, req.body.cl).then(()=>{
        res.sendStatus(200)
    }).catch(()=>{
        res.sendStatus(400)
    })
})

/**
 * Middleware to exclude the non-authorised api calls to authorised api calls 
 * I will take a 0.1 second delay cause of session inpersistnace
 */
api.use(async (req, res, next) => {
    console.log(req.session)
    await new Promise((resolve, reject) => {
        setTimeout(()=>{
            req.session.reload((err)=>{
                if (!err) {
                    reject(err)
                }
                resolve()
            })
        }, 100)})
    if (req.session.token) {
        const allType = ['/removeFirst']
        const teacherType = ['/headers', '/studentdata']
        const studentType = []
        auth.getUserInfo(req.session.token).then((user)=>{
            console.log(user)
            if (allType.includes(req.path)) {
                next()
            } else if (teacherType.includes(req.path) && user.type === 1) {
                next()
            } else if (studentType.includes(req.path) && user.type === 0) {
                next()
            } else {
                res.status(401).json({})
            }
        }).catch(()=>{
            res.status(401).json({})
        })
    } else {
        res.status(401).json({})
    }
})

api.post('/removeFirst', (req, res) => {
    auth.removeFirst(req.session.token).then(()=>{
        res.status(200).json({})
    }).catch(()=>{
        res.status(400).json({})
    })
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
app.get('*', (req, res)=>{
    res.redirect('/#/lost')
})
app.listen(3000)