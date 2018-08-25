const database = require('./database')

exports.fetchClasses() = async () => {
    return database.fetchClasses()
}

exports.fetchSubjects() = async () => {
    return database.fetchSubjects()
}