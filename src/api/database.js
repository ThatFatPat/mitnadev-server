const mysql = require('mysql')

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'i9HE6K#a2U3p',
    database: 'mitnadev',
})

exports.connection = connection

connection.connect((err)=>{
    if (err) {
        console.error(err)
    } else {
        console.log('Successfully connected to the database.')
    }
})

async function queryingAsync(query, values) {
    return new Promise ((resolve, reject)=>{
        connection.query(query, values, (err, res) => {
            if (err) {
                console.log(err)
                reject(err)
            }
            resolve(res)
        })
    })
}

/**
 * this will register a teacher
 * @param {string} id 
 * @param {string} name 
 * @param {string} password hashed password
 * @param {string} subjectname the name of the subject
 */
exports.registerTeacher = async function (id, name, pass, subjectname) {
    return queryingAsync('CALL registerTeacher(?, ?, ?, ?);', [id, name, pass, subjectname])
}

/**
 * this will register a student
 * @param {string} id 
 * @param {string} name 
 * @param {string} password hashed password
 * @param {string} phone 
 * @param {string} email 
 * @param {number} cl 
 */
exports.registerStudent = async function (id, name, pass, phone, email, cl) {
    return queryingAsync('CALL registerStudent(?, ?, ?, ?, ?, ?)', [ id, name, pass, phone, email, cl ])
}

/**
 * get the hashed password of a user
 * @param {string} id 
 */
exports.getHashedPass = async function (id) {
    return (await queryingAsync('SELECT * FROM users WHERE ?', {id}))[0].pass
}

/**
 * get basic user info
 * @param {string} id 
 */
exports.getUserInfo = async function (id) {
    const user = (await queryingAsync('SELECT * FROM users WHERE ?', {id}))[0]
    return {id: user.id, name: user.name, type: user.type, firstLogin: user.firstLogin}  // return only the client friendly user info
}

/**
 * not to be confused with getUserInfo, this will give us the data we need about the student itself. not user related stuff 
 * @param {string} id the id of the student
 */
exports.getStudentInfo = async function (id) {
    return (await queryingAsync('SELECT * FROM students WHERE ?', {id}))[0]
}

exports.removeFirst = async function (id) {
    await queryingAsync('UPDATE users SET firstLogin = 0 WHERE ?', {id})
}

/**
 * Basically it will take the student's name, the class's name and whether this match is active by the teacher's id
 */
exports.fetchData = async function (id) {
    if (id == null) {
        return queryingAsync(`SELECT matches.active, users.name student, classes.name cl
        FROM matches
        JOIN users ON users.id = matches.students_id
        JOIN students ON students.id = matches.students_id
        JOIN classes ON classes.id = students.class`)
    }
    return queryingAsync(`SELECT matches.active, users.name student, classes.name cl
    FROM matches
    JOIN users ON users.id = matches.students_id
    JOIN students ON students.id = matches.students_id
    JOIN classes ON classes.id = students.class
    WHERE matches.rakazim_id = ?`, id)
}

exports.fetchClasses = async function () {
    return queryingAsync('SELECT * from classes')
}

exports.fetchSubjects = async function () {
    return queryingAsync('SELECT rakazim.name as name, rakazim.subj_id as id from rakazim')
}

exports.addClass = async function (name) {
    return queryingAsync('INSERT INTO classes (name) VALUES (?)', name)
}

exports.addSubject = async function (name) {
    return queryingAsync('INSERT INTO subjects (name) VALUES (?)', name)
}

exports.addUser = async function (id, name, password, type) {
    return queryingAsync('INSERT INTO users (id, name, pass, type, firstLogin) VALUES (?, ?, ?, ?, 0)', [id, name, password, type])
}

process.on('SIGTERM', ()=>{
    connection.end()
})