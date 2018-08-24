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
 */
exports.registerTeacher = async function (id, name, pass) {
    console.log(id + ' ' + name + ' ' + pass + ' ')
    return queryingAsync('CALL registerTeacher(?, ?, ?);', [id, name, pass])
}

/**
 * this will register a student
 * @param {string} id 
 * @param {string} name 
 * @param {string} password hashed password
 * @param {string} phone 
 * @param {string} email 
 * @param {number} subject1 all the other subjects will be added in the user settings later
 * @param {number} cl 
 */
exports.registerStudent = async function (id, name, pass, phone, email, subject1, cl) {
    return queryingAsync('CALL registerStudent(?, ?, ?, ?, ?, ?, ?)', [ id, name, pass, phone, email, subject1, cl ])
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

process.on('SIGTERM', ()=>{
    connection.end()
})