require("dotenv").config()
const {createClient} = require("./src/utils/database")

;(async function () {
    const client = createClient()

    // await client.query("CREATE DATABASE $1", [process.env.DB_NAME])
    console.log("Datbase was created ....")

    let tables = [
        "material",
        "mint",
        "person",
        "honorific",
        "title"
    ]


    tables.forEach(async table => {
        await createTextDatabase(table).catch(console.log).then(() => console.log(table))
    })

    function createTextDatabase(name) {
        return client.query(`
        CREATE TABLE $1 (
            id SERIAL PRIMARY_KEY,
            name TEXT
            )
        `, [name])
    }
}())
