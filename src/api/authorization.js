const bcrypt = require('bcrypt') // one of the best password hashers, it auto generates salts to prevent rainbow tables.
const database = require('./database')

async function hashPass(password) {
    await bcrypt.hash(password, 10)
}

export async function registerTeacher(id, name, password) {
    const hashedpass = await hashPass(password)
    return database.registerTeacher(id, name, hashedpass)
}

export async function registerStudent(id, name, password, phone, email, subject1, cl /* class, can't type that obviously */) {
    const hashedpass = await hashPass(password)
    return database.registerStudent(id, name, hashedpass)
}

export async function login(id, password) {
    const hashedpass = await database.getHashedPass(id)
    if (await bcrypt.compare(password, hashedpass)) {
        return await database.getUserInfo(id)
    } else {
        return null
    }
}

export async function getUserInfo(id) {
    return await database.getUserInfo(id)
}

export async function removeFirst(id) {
    return await database.removeFirst(id)
}