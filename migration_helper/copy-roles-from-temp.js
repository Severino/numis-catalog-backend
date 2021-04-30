const { Database, pgp } = require("../src/utils/database.js")

async function createDefaultRoles() {

    const roles = [
        "cutter",
        "heir",
        "warden",
        "caliph",
    ]

    const roleInsertArray = roles.map(role => { return { name: role } })
    const query = pgp.helpers.insert(roleInsertArray, ["name"], "person_role")
    return await Database.none(query)
}

// "person", "role", "role_legacy
async function main() {

    await createDefaultRoles()

    let rows = await Database.manyOrNone("SELECT id, role_legacy FROM person")
    let roles = await Database.many("SELECT id, name FROM person_role")

    const roleMap = {}
    roles.forEach(role => {

        if (role.name != "overlord" && roleMap[role.name] == null) {
            roleMap[role.name] = role.id
        }
    })

    rows = rows.filter(row => (row.role_legacy != null && row.role_legacy != "overlord"))

    rows = rows.map(row => {
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