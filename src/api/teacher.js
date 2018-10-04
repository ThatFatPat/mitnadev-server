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
    return [['תלמיד/ה', 'name'], ['כיתה', 'class'], ['מורה אחראי/ת', 'teacher'], ['תיאור', 'desc'], ['פעיל', 'active']]
}
exports.fetchStudentsHeaders = () =>{
    return [['תלמיד/ה', 'name'], ['כיתה', 'class']]
}
exports.addConnection = async (student, teacher, desc, rakaz) => {
    return database.addConnection(student, teacher, desc, rakaz)
}

exports.editConnection = async (desc, teacher, key, active) => {
    return database.editConnection(desc, teacher, key, active)
}

exports.fetchMatch = async (key, id) => {
    const match = (await database.fetchMatch(key))[0]
    if (!id){
        return match
    }
    else{
        return match.rakazim_id === id ? match : null
    }
}

exports.fetchData = async (id) => {
    database.fetchTeacherData(id)
}