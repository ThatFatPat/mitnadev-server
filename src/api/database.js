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
exports.registerStudent = async function (id, name, pass, phone, email, cl, subjectid) {
    return queryingAsync('CALL registerStudent(?, ?, ?, ?, ?, ?, ?)', [ id, name, pass, phone, email, cl, subjectid])
}

exports.addSubject = async (id, subject) => {
    return queryingAsync('CALL addSubject(?, ?)', [id, subject])
}

exports.removeSubject = async (id, subject) => {
    return queryingAsync('CALL removeSubject(?, ?)', [id, subject])
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
    return queryingAsync(`SELECT subj_id id, subjectname name FROM rakazim`)
}

exports.fetchMatchesStudent = async function (id) {
    return queryingAsync(`SELECT matches.id id, rakazim.subjectname subject, users.name name, matches.active
    FROM matches
    JOIN rakazim ON rakazim.subj_id = matches.rakazim_id
    JOIN users ON rakazim.id = users.id
    WHERE matches.student_id = ? ORDER BY matches.active DESC`, id)
}

exports.fetchMatchesTeacher = async function (id) {
    if (id==null){ // For Admin
        return queryingAsync(`SELECT matches.id id, rakazim.subjectname subject, users.name name, matches.active active, classes.name class, matches.teacher teacher, matches.desc \`desc\`
        FROM matches
        JOIN rakazim ON rakazim.subj_id = matches.rakazim_id
        JOIN users ON students.id = users.id
        JOIN classes ON students.class = classes.id ORDER BY matches.active DESC`)}
    else {
    return queryingAsync(`SELECT matches.id id, users.name name, matches.active active, classes.name class, matches.teacher teacher, matches.desc \`desc\`
    FROM matches
    JOIN rakazim ON rakazim.id = matches.rakazim_id
    JOIN students ON students.id = matches.student_id
    JOIN users ON students.id = users.id
    JOIN classes ON students.class = classes.id
    WHERE matches.rakazim_id = ? ORDER BY matches.active DESC`, id)}
}

/*exports.fetchMatchingStudents = async function(id){
    subj_id = queryingAsync('SELECT subj_id FROM rakazim WHERE id = ?' ,id)
    return queryingAsync('SELECT students.id id, rakazim.subjectname subject, users.name name, FROM rakazim JOIN students WHERE (students.subj_id1 = ? OR students.subj_id2 = ? OR students.subj_id3 = ?' ,subj_id)
}*/

exports.addClass = async function (name) {
    return queryingAsync('CALL addClass(?);', name)
}

exports.removeClass = async function (id) {
    return queryingAsync('CALL removeClass(?)', id)
}

exports.addUser = async function (id, name, password, type) {
    return queryingAsync('CALL addUser(?, ?, ?, ?)', [id, name, password, type])
}

exports.addConnection = async function (id, teacher, desc, rakaz) {
    return queryingAsync('CALL addConnection(?, ?, ?, ?)', [id, rakaz, desc, teacher])
}

exports.editConnection = async function (desc, teacher, id, active) {
    return queryingAsync('CALL editConnection(?, ?, ?, ?)', [desc, teacher, active, id])
}

exports.fetchMatch = async (key) => {
    return queryingAsync(`SELECT matches.id id, matches.student_id student_id, matches.rakazim_id rakazim_id, matches.active active,
    matches.desc \`desc\`, matches.teacher teacher, users.name name, students.phone phone, students.email email, classes.name class
    FROM matches
    JOIN users ON matches.student_id = users.id
    JOIN students ON matches.student_id = students.id
    JOIN classes ON classes.id = students.class
    WHERE matches.id = ?`, key)
}

exports.fetchStudentData = async (id) => {
    return queryingAsync(`SELECT users.id id, users.name name, students.phone phone, students.email email, classes.name class, rakazim.subjectname subject, rakazim.subj_id sid, rakaz.name rname
    FROM users
    JOIN students ON students.id = users.id 
    JOIN classes ON students.class = classes.id 
    JOIN students_subjects ON students_subjects.student_id = users.id 
    JOIN rakazim ON students_subjects.subject_id = rakazim.subj_id
    JOIN users rakaz ON rakaz.id = rakazim.id 
    WHERE users.id = ?`, id)
}

exports.fetchTeacherData = async (id) => {
    return queryingAsync(`SELECT users.id id, users.name name WHERE users.id = ?`, id)
}

process.on('SIGTERM', ()=>{
    connection.end()
})
