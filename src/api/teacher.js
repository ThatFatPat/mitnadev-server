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