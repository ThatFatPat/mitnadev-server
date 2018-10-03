const conf = require('./config')
const express = require('express')
const passport = require('passport') // this will be used to remember logged in users
const session = require('express-session')
const path = require('path')
const auth = require('./api/authorization')
const teacher = require('./api/teacher')
const student = require('./api/student')
const admin = require('./api/admin')
const bodyParser = require('body-parser')
const MySQLStore = require('express-mysql-session')(session) // this will remember logged in users and save it in mysql
const connection = require('./api/database').connection
const cors = require('cors')
const cookieParser = require('cookie-parser')
const store = new MySQLStore({}, connection)
const helmet = require('helmet')
const ejs = require('ejs')
const flash = require('connect-flash')


const app = express()

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

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
    rolling: true,
    cookie: {
        maxAge: 900000,
        credentials: true,
        secure: false
    }
}))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(flash())

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
//  */
// app.use('*', cors({
//     origin: config.cors,
//     credentials: true
// }))
const sendTemplate = (req, res, template, data = {}) => {
    res.render(template, Object.assign({
        user: req.user
    }, data))
}

app.get('/', (req, res)=>{
    if (!req.user) {
        res.redirect('/login')
    } else if (req.user.type === 0) {
        student.fetchMatches(req.user.id).then((matches) => {
            sendTemplate(req, res, 'student', {
                headers: student.fetchMatchesHeaders(),
                matches
             })
        }).catch(err=>{
            sendTemplate(req, res, 'error', {errorno: 500, error: 'Unexpected Server Error'})
        })
    } else if (req.user.type === 1) {
        teacher.fetchMatches(req.user.id).then((matches) => {
            sendTemplate(req, res, 'teacher', {
                headers: teacher.fetchMatchesHeaders(),
                matches
             })
        }).catch(err=>{
            sendTemplate(req, res, 'error', {errorno: 500, error: 'Unexpected Server Error'})
        })
    }
    else if (req.user.type === 2) {
        student.fetchClasses().then((classes)=>{
            sendTemplate(req, res, 'admin', {
                classes
            })
        })
    }
})

app.get('/login', (req, res)=>{
    if (req.user) {
        res.redirect('/')
    } else {
        let error = req.flash('error')[0]
        if (!error){
            error = ''
        }
        let success = req.flash('success')[0]
        if (!success){
            success = ''
        }
        sendTemplate(req, res, 'login', {errorMessage: error, successMessage: success})
    }
})

/**
 * This will be used to authenticate and retrieve user information
 */
app.post('/user', (req, res, next)=>{
    rememberMe = req.body.rememberMe
    if (rememberMe) {
        req.session.cookie.maxAge = 604800000
    }
    next()
},
    passport.authenticate('local', { successRedirect: '/',
                                                   failureRedirect: '/login',
                                                   failureFlash: 'תעודת זהות או סיסמה שגויה' 
                                                })
)

app.get('/logout', (req, res) => {
    req.logOut()
    res.redirect('/')
})

app.post('/registerteacher', (req, res) => {
    if (req.body.secret !== 'iO2fSA78fS') {
        sendTemplate(req, res, 'error', {errorno: 401, error: 'קוד לא תקין'})
        return
    }
    auth.registerTeacher(req.body.id, req.body.name, req.body.password, req.body.subject).then(()=>{
        req.flash('success', 'הרשמה נקלטה בהצלחה')
        res.redirect('/login')
    }).catch(()=>{
        req.session.errorMessage = 'אנא ודאו כי הפרטים שהזנתם תקינים ונסו שנית'
        res.redirect('/registerS')
    })
})

app.get('/register', (req, res) =>{
    sendTemplate(req, res, 'register')
})

app.get('/registerS', (req, res)=>{
    let classes
    let errorMessage = req.session.errorMessage ? req.session.errorMessage : ''
    req.session.errorMessage = ''
    student.fetchClasses().then((cs)=>{
        classes = cs
        return student.fetchSubjects()
    }).then((subjects)=>{
        sendTemplate(req, res, 'registerS', {classes, errorMessage, subjects})
    }).catch(()=>{
        sendTemplate(req, res, 'error', {errorno: 500, error: 'Unexpected Server Error'})
    })
})
app.get('/registerT', (req, res)=>{
        const errorMessage = req.session.errorMessage ? req.session.errorMessage : ''
        req.session.errorMessage = ''
        sendTemplate(req, res, 'registerT', {errorMessage})
})

app.post('/register', (req, res) => {
    auth.registerStudent(req.body.id, req.body.name, req.body.password, req.body.phone, req.body.email, req.body.cl, req.body.subj_id1, req.body.subj_id2, req.body.subj_id3).then(()=>{
        req.flash('success', 'הרשמה נקלטה בהצלחה')
        res.redirect('/login')
    }).catch(()=>{
        req.session.errorMessage = 'אנא ודאו כי הפרטים שהזנתם תקינים ונסו שנית'
        res.redirect('/registerS')
    })
})

app.get('/settings', (req, res)=>{
    if (req.user) {
        switch (req.user.type) {
            case 0:
                student.fetchData(req.user.id).then((data)=>{
                    sendTemplate(req, res, 'settings', {data})
                })
                break;
            case 1:
                teacher.fetchData(req.user.id).then((data)=>{
                    sendTemplate(req, res, 'settings', {data})
                })

        }
    } else {
        sendTemplate(req, res, 'error', {errorno: 401, error: 'Unauthorized'})
    }
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
        sendTemplate(req, res, 'error', {errorno: 403, error: 'Forbidden'})
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

/**
 * Middleware to exclude the non-authorised api calls to authorised api calls 
 */
app.use((req, res, next) => {
    const adminType = ['/addclass', '/removeclass']
    const teacherType = ['/addconnection', '/matchdata', '/editconnetion']
    const studentType = []
    const need_auth = adminType.concat(teacherType)
    if (req.user) {
        const user = req.user
        if (teacherType.includes(req.path) && user.type !== 1) {
            return sendTemplate(req, res, 'error', {errorno: 403, error: 'Forbidden'})
        } else if (studentType.includes(req.path) && user.type !== 0) {
            return sendTemplate(req, res, 'error', {errorno: 403, error: 'Forbidden'})
        } else if (adminType.includes(req.path) && user.type !== 2) {
            return sendTemplate(req, res, 'error', {errorno: 403, error: 'Forbidden'})
        } else {
            next()
        }
    } else {
        if (need_auth.includes(req.path)) {
            res.status(403)
            return sendTemplate(req, res, 'error', {errorno: 403, error: 'Forbidden'})
        } else {
            next()
        }
    }
})

/**
 * Administrator Authenticated
 */

app.post('/addclass', (req, res) => {
    admin.addClass(req.body.name).then(()=>{
        res.redirect('/')
    }).catch((error)=>{
        res.status(400).json(error) // invalid name
    })
})

app.post('/removeclass', (req, res) => {
    admin.removeClass(req.body.id).then(()=>{
        res.redirect('/')
    }).catch((error)=>{
        res.status(400).json(error) // invalid id
    })
})


//===============TEMP================

app.get('/addconnection', (req, res) => {
    teacher.fetchStudents(req.user.id).then((students) => {
        sendTemplate(req, res, 'addconnection', {
            headers: teacher.fetchStudentsHeaders(),
            students
        })
    }).catch((err)=>{
        sendTemplate(req, res, 'error', {errorno: 500, error: err})
    })
})

app.post('/addconnection', (req, res) => {
    const student = req.body.studenttableradio
    const teacher_name = req.body.teacher
    const desc = req.body.desc
    const rakaz = req.user.id
    if (desc && desc.length > 255) {
        return sendTemplate(req, res, 'error', {errorno: 400, error: 'תיאור ארוך מדי'})
    } else if (teacher_name && teacher_name > 255) {
        return sendTemplate(req, res, 'error', {errorno: 400, error: 'שם מורה ארוך מדי'})
    } else {
        teacher.addConnection(student, teacher_name, desc, rakaz).then(()=>{
            return res.redirect('/')
        }).catch((err)=>{
            return sendTemplate(req, res, 'error', {errorno: 500, error: err})
        })
    }
})

app.post('/editconnection', (req, res) => {
    const teacher_name = req.body.teacher
    const desc = req.body.desc
    let active = req.body.active
    const key = req.body.key
    if (!key) {
        return sendTemplate(req, res, 'error', {errorno: 400, error: 'חסר מפתח'})
    }
    active = !!active // booleanify active
    if (desc && desc.length > 255) {
        return sendTemplate(req, res, 'error', {errorno: 400, error: 'תיאור ארוך מדי'})
    } else if (teacher_name && teacher_name > 255) {
        return sendTemplate(req, res, 'error', {errorno: 400, error: 'שם מורה ארוך מדי'})
    } else {
        teacher.editConnection(desc, teacher_name, key, active).then(()=>{
            return res.redirect('/')
        }).catch((err)=>{
            return sendTemplate(req, res, 'error', {errorno: 500, error: err})
        })
    }
})

app.post('/matchdata', (req, res)=>{
    const key = req.body.key
    teacher.fetchMatch(key, req.user.id).then((match)=>{
        if (match) {
            res.json(match)
        } else {
            res.send('null')
        }
    })
})

//=================================


app.get('*', (req, res)=>{ // 404 back to the website
    sendTemplate(req, res, 'error', {errorno: 404, error: 'Page Not Found'})
})
app.listen(config.port)