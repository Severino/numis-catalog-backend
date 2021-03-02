require("dotenv").config()
const pgp = require("pg-promise")({
    query: function (e) {
        console.log(e.query); // log the query being executed
    }
})

const Database = pgp({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
})

module.exports = { Database, pgp } 