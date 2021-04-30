const { Database, pgp } = require("../src/utils/database.js")


async function main() {
    let rows = await Database.manyOrNone("SELECT id, name FROM person")

    let dynasties = []

    const regex = /\((.+?)(\)|,)/

    rows.forEach((row, idx) => {
        let result = regex.exec(row.name)
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

    const insertQuery = pgp.helpers.insert(dynasties, ["name"], "dynasty") + " ON CONFLICT DO NOTHING"
    await Database.manyOrNone(insertQuery)




    let existingDynasties = await Database.manyOrNone("SELECT id, name FROM dynasty")

    let dynastieMap = {}
    existingDynasties.forEach(row => {
        dynastieMap[row.name] = row.id
    })
    console.log(dynastieMap)


    for (let row of rows.values()) {
        console.log(row)
        let result = regex.exec(row.name)
        if (result) {
            const dynasty = result[1]
            const index = dynastieMap[dynasty]
            await Database.none("UPDATE person SET dynasty = $1 WHERE id=$2", [index, row.id])
            console.log(`Updated dynasty on ${row.name}(${row.id}) to ${dynasty}(${index}).`)
        } else console.log(`Skipped ${row.name}(${row.id}). No match was found.`)
    }

}




; (async function () {
    await main().catch(console.error)
})()