const { Database, pgp } = require("../src/utils/database.js")

const roles = [
    "cutter",
    "heir",
    "warden",
    "overlord",
    "caliph",
]

const roleInsertArray = roles.map(role => { return { name: role } })
const query = pgp.helpers.insert(roleInsertArray, ["name"], "person_role")
Database.none(query)