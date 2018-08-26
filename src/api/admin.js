const database = require('./database')

exports.addClass = async (name) => {
    if (!/^(\p{L}|[0-9\'\"]){0,45}$/.test(name)) {
        throw 'Invalid name'
    }
    return database.addClass(name)
}