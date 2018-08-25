const database = require('./database')

/**
 * Will fetch student data
 */
exports.fetchData = async (id) => {
    return database.fetchData(id)
}