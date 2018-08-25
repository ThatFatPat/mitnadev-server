const bcrypt = require('bcrypt') // one of the best password hashers, it auto generates salts to prevent rainbow tables.
const database = require('./database')
const LocalStrategy = require('passport-local').Strategy

function validDetails(data) {
    if (data.id && !(/^[0-9]{9}$/).test(data.id)) {
        return false
    } else if (data.password && !(/^[A-Za-z0-9#$^+=!*()@%&]{8,}$/).test(data.password)) {
        return false
    } else if (data.name && !(/^(\p{L}|\s){5,45}$/).test(data.name)) {
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

exports.registerTeacher = async function (id, name, password) {
    const hashedpass = await hashPass(password)
    return database.registerTeacher(id, name, hashedpass)
}

exports.registerStudent = async function (id, name, password, phone, email, subject1, cl /* class, can't type that obviously */) {
    const hashedpass = await hashPass(password)
    return database.registerStudent(id, name, hashedpass)
}

exports.getUserInfo = async function (id) {
    return database.getUserInfo(id)
}

exports.removeFirst = async function (id) {
    return database.removeFirst(id)
}