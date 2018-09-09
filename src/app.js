const conf = require('./config')
const express = require('express')
const passport = require('passport') // this will be used to remember logged in users
const session = require('express-session')
const path = require('path')
const auth = require('./api/authorization')
const teacher = require('./api/teacher')
const student = require('./api/student')
const admin = require('./api/admin')
const MySQLStore = require('express-mysql-session')(session) // this will remember logged in users and save it in mysql
const connection = require('./api/database').connection
const cors = require('cors')
const cookieParser = require('cookie-parser')
const store = new MySQLStore({}, connection)
const helmet = require('helmet')

const app = express()

// Choose run configuration.
const config = conf.choose_config(process.env.NODE_ENV)
app.use(helmet())
app.use(express.json())
app.use(cookieParser('shhh it is a secret'))
app.use(session({
    secret: 'shhh it is a secret',
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
        maxAge: 900000,
        credentials: true,
        secure: false
    }
}))

/**
 * Initialize passport
 */
app.use(passport.initialize());
app.use(passport.session());
passport.use(auth.strategy)
passport.serializeUser((user, done)=>{
    done(null, user)
})
passport.deserializeUser((user, done)=>{
    done(null, user)
})

/**
 * enable cors
 */
app.use('*', cors({
    origin: config.cors,
    credentials: true
}))

app.set('view engine', 'ejs')
const sendTemplate = (req, res, template, data = {}) => {
    res.render(template, Object.assign({
        user: req.user
    }, data))
}

app.get('/', (req, res)=>{
    if (!req.user) {
        res.redirect('/login')
    } else if (req.user.type === 0) {
        sendTemplate(req, res, 'student')
    } else if (req.user.type === 1) {
        sendTemplate(req, res, 'teacher')
    }
    else if (req.user.type === 2) {
        sendTemplate(req, res, 'admin')
    }
})

app.get('/login', (req, res)=>{
    if (req.user) {
        res.redirect('/')
    } else {
        sendTemplate(req, res, 'login')
    }
})

/**
 * This will be used to authenticate and retrieve user information
 */
app.post('/user', (req, res, next) => {
    id = req.body.id
    password = req.body.password
    rememberMe = req.body.rememberMe
    if (rememberMe) {
        req.session.cookie.maxAge = 604800000
    }
    passport.authenticate('local', (err, user, info)=>{
        if (err) {
            console.log(err)
            return res.sendStatus(400)
        }
        if (!user) {
            return res.sendStatus(401)
        }
        req.login(user, err=>{
            if (err) {
                return res.sendStatus(500)
            }
            return res.json(user)
        })
    })(req, res, next);
})

app.get('/logout', (req, res) => {
    req.logOut()
    res.sendStatus(200)
})

app.post('/registerteacher', (req, res) => {
    if (req.body.secret !== 'iO2fSA78fS') {
        res.sendStatus(401)
        return
    }
    auth.registerTeacher(req.body.id, req.body.name, req.body.password, req.body.subject).then(()=>{
        res.sendStatus(200)
    }).catch((err)=>{
        res.status(400).send({error: err})
    })
})

app.post('/register', (req, res) => {
    auth.registerStudent(req.body.id, req.body.name, req.body.password, req.body.phone, req.body.email, req.body.cl).then(()=>{
        res.sendStatus(200)
    }).catch(()=>{
        res.sendStatus(400)
    })
})

app.get('/classes', (req, res) => {
    student.fetchClasses().then((classes)=>{
        res.json({classes})
    }).catch(()=>{
        res.sendStatus(500)
    })
})

app.get('/subjects', (req, res) => {
    student.fetchSubjects().then((subjects)=>{
        return res.json({subjects})
    }).catch(()=>{
        res.sendStatus(500)
    })
})

/**
 * This will be used to add the admins, it shall not be used for any other user type because of database relation system
 */
app.post('/adduser', (req, res) => {
    if (req.body.secret !== 'sea292weFM1') {
        res.sendStatus(403)
    } else {
        auth.addUser(req.body.id, req.body.name, req.body.password, req.body.type).then(()=>{
            res.sendStatus(200)
        }).catch(()=>{
            res.sendStatus(400)
        })
    }
})

app.use('/static', express.static(path.join(__dirname, 'static'))) 
app.use('/assets', express.static(path.join(__dirname, 'assets')))
app.get('*', (req, res)=>{ // 404 back to the website
    sendTemplate('error', {errorno: 404, error: 'Page Not Found'})
})

/**
 * Middleware to exclude the non-authorised api calls to authorised api calls 
 */
app.use((req, res, next) => {
    if (req.user) {
        const allType = ['/removeFirst', '/user']
        const adminType = ['/addclass', '/studentdata', '/headers', '/removeclass']
        const teacherType = ['/headers', '/studentdata']
        const studentType = ['/matches']
        const user = req.user
        if (allType.includes(req.path)) {
            next()
        } else if (teacherType.includes(req.path) && user.type === 1) {
            next()
        } else if (studentType.includes(req.path) && user.type === 0) {
            next()
        } else if (adminType.includes(req.path) && user.type === 2) {
            next()
        } else {
            return res.sendStatus(403)
        }
    } else {
        return res.sendStatus(403)
    }
})

/**
 *  Student Authenticated
 */

app.get('/matches', (req, res) => {
    student.fetchMatches(id).then((matches) => {
        res.json({matches})
    }).catch(err=>{
        res.status(400).json({})
    })
})

/**
 * Teacher Authenticated
 */
app.get('/headers', (req, res) => {
    res.json({ headers: [['סטודנט', 'name'], ['כיתה', 'class'], ['נושא', 'subject']] })
})

app.get('/studentdata', (req, res) =>  {
    let id = req.user.id
    if (req.user.type === 2) {
        id = null
    }
    teacher.fetchData(id).then((data)=>{
        res.json({data})
    }).catch(()=>{
        res.sendStatus(500)
    })
})

/**
 * Administrator Authenticated
 */

app.post('/addclass', (req, res) => {
    admin.addClass(req.body.name).then(()=>{
        res.sendStatus(200)
    }).catch((error)=>{
        res.status(400).json(error) // invalid name
    })
})

api.post('/removeclass', (req, res) => {
    admin.removeClass(req.body.id).then(()=>{
        res.sendStatus(200)
    }).catch((error)=>{
        res.status(400).json(error) // invalid id
    })
})
app.listen(config.port)