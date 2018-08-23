const mysql = require('mysql')

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'i9HE6K#a2U3p',
    database: 'mitnadev'
})

connection.connect((err)=>{
    process.exit(1)
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
export async function registerTeacher(id, name, password) {
    return await queryingAsync('CALL registerTeacher(?, ?, ?);', [id, name, password])
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
export async function registerStudent(id, name, password, phone, email, subject1, cl) {
    return await queryingAsync('CALL registerStudent(?, ?, ?, ?, ?, ?, ?)', [ id, name, password, phone, email, subject1, cl ])
}

/**
 * get the hashed password of a user
 * @param {string} id 
 */
export async function getHashedPass(id) {
    return (await queryingAsync('SELECT * FROM users WHERE ?', {id}))[0].pass
}

/**
 * get basic user info
 * @param {string} id 
 */
export async function getUserInfo(id) {
    const user = (await queryingAsync('SELECT * FROM users WHERE ?', {id}))[0]
    return {id: user.id, name: user.name, type: user.type, firstLogin: user.firstLogin}  // return only the client friendly user info
}

/**
 * not to be confused with getUserInfo, this will give us the data we need about the student itself. not user related stuff 
 * @param {string} id the id of the student
 */
export async function getStudentInfo(id) {
    return (await queryingAsync('SELECT * FROM students WHERE ?', {id}))[0]
}

export async function removeFirst(id) {
    await queryingAsync('UPDATE users SET firstLogin = 0 WHERE ?', {id})
}

process.on('SIGTERM', ()=>{
    connection.end()
})