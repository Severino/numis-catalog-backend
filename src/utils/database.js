require("dotenv").config()
const pgp = require("pg-promise")({
    // // This logs the queries that are executed.
    // query: function (e) {
    //     console.log(e.query);
    // }
})

const Database = pgp({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
})

module.exports = { Database, pgp } 