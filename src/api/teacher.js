const database = require('./database')

/**
 * Will fetch student data
 */
exports.fetchStudents = async (id) => {
    return database.fetchStudents(id)
}
exports.fetchMatches = async (id) => {
    return database.fetchMatchesTeacher(id)
}

exports.fetchMatchesHeaders = () => {
    return [['סטודנט', 'name'], ['כיתה', 'class'], ['מורה אחראית', 'teacher'], ['תיאור', 'desc']]
}

exports.addConnection = (student, teacher, desc, rakaz) => {
    return database.addConnection(student, teacher, desc, rakaz)
}