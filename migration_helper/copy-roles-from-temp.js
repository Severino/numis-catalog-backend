const { Database, pgp } = require("../src/utils/database.js")

// "person", "role", "role_legacy
async function main() {
    let rows = await Database.manyOrNone("SELECT id, role_legacy FROM person")
    let roles = await Database.many("SELECT id, name FROM person_role")

    console.log(roles)
    const roleMap = {}
    roles.forEach(role => {


        if (roleMap[role.name] == null) {
            roleMap[role.name] = role.id
        }
    })

    rows = rows.map(row => {

        /** All that have no role are overlords! */
        if (row.role_legacy == null)
            row.role_legacy = "overlord"

        let role = (roleMap[row.role_legacy] == null) ? null : roleMap[row.role_legacy]

        if (!role) console.error(`Mistake on role "${row.role_legacy}" of element with id "${row.id}".`)

        return {
            id: row.id,
            role
        }
    })


    const query = pgp.helpers.update(rows, ["?id", "role"], "person") + " WHERE v.id = t.id"
    await Database.manyOrNone(query)
}


; (async function () {
    await main().catch(console.error);
})()