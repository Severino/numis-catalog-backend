const { Database, pgp } = require("../src/utils/database.js")


async function main() {
    let rows = await Database.manyOrNone("SELECT id, name FROM person")

    let dynasties = []

    const insideBrackedMatch = /\((.+?)\)/g

    rows.forEach(row => {
        let match = insideBrackedMatch.exec(row.name)
        if (match) {
            console.log(match[1])
        } else { 
            console.error("Could not match the dynastie: ", match) 
        }
    })

    // console.log(rows)
}




; (async function () {
    await main().catch(console.error)
})()