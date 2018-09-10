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
    return [['סטודנט', 'name'], ['כיתה', 'class'], ['נושא', 'subject']]
}