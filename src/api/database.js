const conf = require('../config')
const mysql = require('mysql')

// Choose run configuration.
const config = conf.choose_config(process.env.NODE_ENV)

const connection = mysql.createConnection({
    host: config.db_host,
    user: config.db_username,
    password: config.db_pass,
    database: config.db_name,
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
    return new Promise ((resolve, reject) => {
        connection.beginTransaction((err)=>{
            if (err) reject(err);

            connection.query('CALL registerTeacher(?, ?, ?, ?);', [id, name, pass, subjectname], function (error) {
                if (error) {
                    return connection.rollback(()=>{
                        reject(error)
                    })
                } else {resolve()}
            })
        })
    }
)}

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
    return new Promise ((resolve, reject) => {
        connection.beginTransaction((err)=>{
            if (err) reject(err);

            connection.query('CALL registerStudent(?, ?, ?, ?, ?, ?)', [ id, name, pass, phone, email, cl ], function (error) {
                if (error) {
                    return connection.rollback(()=>{
                        reject(error)
                    })
                } else {resolve()}
            })
        })
    }
)}

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
exports.fetchStudents = async function (id) {
    if (id == null){ // For Admin
        return queryingAsync(`SELECT users.id id, rakazim.subjectname subject, users.name name, classes.name class
        FROM rakazim 
        JOIN students_subjects ON rakazim.subj_id = students_subjects.subject_id
        JOIN students ON subjects_students.student_id = students.id
        JOIN classes ON classes.id = students.class 
        JOIN users ON users.id = students.id
        WHERE users.type = 0)`)
    }
    else{
        return queryingAsync(`SELECT users.id id, rakazim.subjectname subject, users.name name, classes.name class
        FROM rakazim 
        JOIN students_subjects ON rakazim.subj_id = students_subjects.subject_id
        JOIN students ON students_subjects.student_id = students.id
        JOIN classes ON classes.id = students.class 
        JOIN users ON users.id = students.id
        WHERE users.type = 0 AND rakazim.id = ?`, id)
    }
}

exports.fetchClasses = async function () {
    return queryingAsync('SELECT * from classes')
}

exports.fetchSubjects = async function () {
    return queryingAsync(`SELECT subj_id id, subjectname subject FROM rakazim`)
}

exports.fetchMatchesStudent = async function (id) {
    return queryingAsync(`SELECT matches.id id, rakazim.subjectname subject, users.name name, matches.active
    FROM matches
    JOIN rakazim ON rakazim.subj_id = matches.rakazim_id
    JOIN users ON rakazim.id = users.id
    WHERE matches.student_id = ?`, id)
}

exports.fetchMatchesTeacher = async function (id) {
    if (id==null){ // For Admin
        return queryingAsync(`SELECT matches.id id, rakazim.subjectname subject, users.name name, matches.active active, classes.name class, matches.teacher teacher, matches.desc \`desc\`
        FROM matches
        JOIN rakazim ON rakazim.subj_id = matches.rakazim_id
        JOIN students ON matches.student_id = students.id
        JOIN users ON students.id = users.id
        JOIN classes ON students.class = classes.id)`)}
    else {
    return queryingAsync(`SELECT matches.id id, users.name name, matches.active active, classes.name class, matches.teacher teacher, matches.desc \`desc\`
    FROM matches
    JOIN rakazim ON rakazim.id = matches.rakazim_id
    JOIN students ON matches.student_id = students.id
    JOIN users ON students.id = users.id
    JOIN classes ON students.class = classes.id
    WHERE matches.rakazim_id = ?`, id)}
}

/*exports.fetchMatchingStudents = async function(id){
    subj_id = queryingAsync('SELECT subj_id FROM rakazim WHERE id = ?' ,id)
    return queryingAsync('SELECT students.id id, rakazim.subjectname subject, users.name name, FROM rakazim JOIN students WHERE (students.subj_id1 = ? OR students.subj_id2 = ? OR students.subj_id3 = ?' ,subj_id)
}*/

exports.addClass = async function (name) {
    return queryingAsync('INSERT INTO classes (name) VALUES (?)', name)
}

exports.removeClass = async function (id) {
    return queryingAsync('DELETE FROM classes WHERE id = ?', id)
}

exports.addSubject = async function (name) {
    return queryingAsync('INSERT INTO subjects (name) VALUES (?)', name)
}

exports.addUser = async function (id, name, password, type) {
    return queryingAsync('INSERT INTO users (id, name, pass, type, firstLogin) VALUES (?, ?, ?, ?, 0)', [id, name, password, type])
}

exports.addConnection = async function (id, teacher, desc, rakaz) {
    return queryingAsync('INSERT INTO matches (student_id, rakazim_id, `desc`, teacher) VALUES (?, ?, ?, ?)', [id, rakaz, desc, teacher])
}

process.on('SIGTERM', ()=>{
    connection.end()
})