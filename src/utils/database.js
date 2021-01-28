

const pgPromise = require("pg-promise")

const pgp = pgPromise({})

function createClient() {
    return pgp({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT
    })
}

module.exports = {createClient, pgp}