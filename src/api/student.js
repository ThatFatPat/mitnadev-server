const database = require('./database')

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
    return [['סטונדט\\ית', 'name'], ['כיתה', 'class'], ['נושא', 'subject']]
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