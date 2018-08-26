const database = require('./database')
const XRegExp = require('xregexp')

const nameregex = XRegExp.build('^(\\pL|\\s){4,45}$')

exports.addClass = async (name) => {
    if (!nameregex.test(name)) {
        throw 'Invalid name'
    } else {
        return database.addClass(name)

    }
}

exports.removeClass = async (id) => {
    if (!/[0-9]+/.test(id)) {
        throw 'Invalid id'
    } else {
        return database.removeClass(id)
    }
}