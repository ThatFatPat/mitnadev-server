const bcrypt = require('bcrypt') // one of the best password hashers, it auto generates salts to prevent rainbow tables.
const database = require('./database')
const LocalStrategy = require('passport-local').Strategy
const xregexp = require('xregexp')

const idregex = /^[0-9]{9}$/
const passregex = /^.{8,}$/
const nameregex = xregexp('^(\\pL|\\s){4, 45}$').compile()
const subjectregex = /^.{2,45}$/
const phoneregex = /^[0-9+-]{7,45}$/
const emailregex = xregexp('^[\\p{L}\\p{N}]+@\\p{L}+[.]\\p{L}+$').compile() // https://stackoverflow.com/questions/19461943/how-to-validate-a-unicode-email
const clregex = /^[0-9]+$/

function validDetails(data) {
    if (data.id && !idregex.test(data.id)) {
        return false
    } else if (data.password && !passregex.test(data.password)) {
        return false
    } else if (data.name && !nameregex.test(data.name)) {
        return false
    } else if (data.subject && !subjectregex.test(data.subject)) {
        return false
    } else if (data.phone && !phoneregex.test(data.phone)) {
        return false
    } else if (data.email && !emailregex.test(data.email)) { 
        return false
    } else if (data.cl && !clregex.test(data.cl)) { // cl is an integer
        return false
    } else {
        return true
    }
}

async function hashPass(password) {
    return bcrypt.hash(password, 10)
}

exports.strategy = new LocalStrategy({usernameField: 'id', passwordField: 'password'}, (id, password, done)=>{
    if (!validDetails({id, password})) {
        return done(null, false)
    }
    database.getHashedPass(id).then((hashedpass)=>{
        bcrypt.compare(password, hashedpass).then((match)=>{
            if (match) {
                database.getUserInfo(id).then(user=>{
                    return done(null, user)
                }).catch(err=>{
                    return done(err)
                })
            } else {
                return done(null, false)
            }
        }).catch(err=>{
            return done(err)
        })
    }).catch(err=>{
        return done(err)
    })
})

exports.registerTeacher = async function (id, name, password, subjectname) {
    if (!validDetails({id, password, name, subject: subjectname})) {
        throw 'invalid details'
    }
    const hashedpass = await hashPass(password)
    return database.registerTeacher(id, name, hashedpass, subjectname)
}

exports.registerStudent = async function (id, name, password, phone, email, cl /* class, can't type that obviously */) {
    if (!validDetails({id, password, name, phone, email, cl})) {
        throw 'invalid details'
    }
    const hashedpass = await hashPass(password)
    return database.registerStudent(id, name, hashedpass, phone, email, cl)
}

exports.getUserInfo = async function (id) {
    return database.getUserInfo(id)
}

exports.removeFirst = async function (id) {
    return database.removeFirst(id)
}

exports.addUser = async (id, name, password, type) => {
    return database.addUser(id, name, await hashPass(password), type)
}