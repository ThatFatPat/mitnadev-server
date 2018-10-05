const database = require('./database')
const XRegExp = require('xregexp')


const idregex = /^[0-9]{9}$/
const passregex = /^.{8,}$/
const nameregex = XRegExp.build('^(\\pL|\\s){4,45}$')
const subjectregex = /^.{2,45}$/
const phoneregex = /^[0-9+-]{7,45}$/
const emailregex = XRegExp.build('^[\\p{L}\\p{N}]+@\\p{L}+[.]\\p{L}+$') // https://stackoverflow.com/questions/19461943/how-to-validate-a-unicode-email
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
    } else if (data.subjectid && !clregex.test(data.subjectid)) {
        return false
    } else {
        return true
    }
}

exports.fetchClasses = async () => {
    return database.fetchClasses()
}

exports.fetchSubjects = async () => {
    return database.fetchSubjects()
}

exports.fetchMatches = async (id) => {
    return database.fetchMatchesStudent(id)
}

exports.fetchMatchesHeaders = () => {
    return [['נושא', 'subject'], ['מורה אחראי/ת', 'teacher'], ['תיאור', 'desc'], ['פעיל', 'active']]
}

exports.fetchData = async (id) => {
    const data = await database.fetchStudentData(id)
    if (data === []) {
        return []
    }
    const parsed = {name: data[0].name, class: data[0].class, id: data[0].id, email: data[0].email, phone: data[0].phone, subjects: []}
    for (let row of data) {
        parsed.subjects.push({subject: row.subject, rname: row.rname, id: row.sid})
    }
    return parsed
}

exports.addSubject = async (id, subject) => {
    return database.addSubject(id, subject)
}

exports.removeSubject = async (id, subject) => {
    return database.removeSubject(id, subject)
}

exports.updateData = async (email, phone, id) => {
    if (!validDetails({email, phone})) {
        throw 'invalid details'
    }

    return database.updateData(id, email, phone)
}