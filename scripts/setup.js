try {
    require("dotenv").config()
} catch (e) {
    console.error("Create an .env file. Check the README.md for required values.")
}

const { createClient } = require("../src/utils/database")
const { spawn } = require("child_process");


async function migrate(){
    
    console.log("Run migrations...")
    const process = spawn("npm run migrate")

    process.stdout.on("data", function(data){
        console.log("migration: " + data)
    })

    process.stderr.on("data", function(data){
        console.log("migration-error: " + data)
    })

    process.on("exit", function(data){
        console.log("migration exited with code  " + data.toString())
    })
}

;(async function () {
    const client = createClient()


    let result = await client.query(`SELECT datname FROM pg_catalog.pg_database WHERE lower(datname) = lower($1);`, [process.env.DB_NAME])
    let status = 1


    if (result.length == 0) {
        console.log(`Creating '${process.env.DB_NAME}' ...`)
        await client.result("CREATE Database $1", [process.env.DB_NAME]).catch((error) => {
            console.error(error)
            status = 0;
        }).then(() => {
            console.log("Datbase was created successfully....")
        })
    } else {
        console.log(`Database '${process.env.DB_NAME}' already exists.`)
    }

    if (status !== 1) return status;

    console.log(`Initialize PostGIS on database...`)
    await client.result(`CREATE EXTENSION IF NOT EXISTS postgis`).catch(() => {
        console.error(`Failed initializing PostGIS.`)
        status = 0;
    }).then(() => {
        console.error(`Initialized PostGIS successfully.`)
    })

    if (status !== 1) return status

    await migrate()

}())


