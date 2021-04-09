const { Database, pgp } = require("../src/utils/database.js")


async function main() {
    let rows = await Database.manyOrNone("SELECT id, name FROM person")

    let dynasties = []

    const regex = /\((.+?)(\)|,)/

    rows.forEach((row, idx) => {
        const result = regex.exec(row.name)
        if (!result) console.log(`No dynastie found on row with id '${row.id}' with name '${row.name}'.`)
        else {

            const dynasty = result[1]
            rows[idx].dynasty = dynasty
            if (dynasties.indexOf(dynasty) == -1) {
                dynasties.push(dynasty)
            }
        }
    })

    dynasties = dynasties.map((el) => {
        return { name: el }
    })

    const insertQuery = pgp.helpers.insert(dynasties, ["name"], "dynasty") + " ON CONFLICT DO NOTHING RETURNING id, name"
    let inserted = await Database.manyOrNone(insertQuery)



}




; (async function () {
    await main().catch(console.error)
})()