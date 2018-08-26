const database = require('./database')
const xregexp = require('xregexp')

const nameregex = xregexp('^(\\pL|\\s){4, 45}$').compile()

exports.addClass = async (name) => {
    if (!nameregex.test(name)) {
        throw 'Invalid name'
    }
    return database.addClass(name)
}