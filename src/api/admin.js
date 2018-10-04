const database = require('./database')
const XRegExp = require('xregexp')

const nameregex = XRegExp.build('^.{2,45}$')

exports.addClass = async (name) => {
    if (!nameregex.test(name)) {
        throw 'Invalid name'
    } else {
        return database.addClass(name)

    }
}

exports.fetchMatchesHeaders = () => {
    return [['תלמיד/ה', 'name'], ['כיתה', 'class'], ['מורה אחראי/ת', 'teacher'], ['תיאור', 'desc'], ['נושא', 'subject'], ['פעיל', 'active']]
}

exports.removeClass = async (id) => {
    if (!/[0-9]+/.test(id)) {
        throw 'Invalid id'
    } else {
        return database.removeClass(id)
    }
}

exports.fetchMatches = async () => {
    return database.fetchMatchesTeacher()
}