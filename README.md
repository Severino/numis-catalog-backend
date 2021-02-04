# Buyiden Project - Backend

This is the backend application of the Buyiden Project. It habdles the Interaction with the database and therefore provides a graphql endpoint.


## Setup

### Install PostgreSQL and PostGIS

#### Windows

Postgres can be downloaded and installed here:
[https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/). After executing the installation, PostGIS can be installed using the *Application Stack Builder*.

The database can be managed using the pre-installed User-Interface of *pgAdmin*.

### Run Init Script

```
    npm run init
```

### Defining environment variables

We provide a *.env.example* file that may serves as a template for your .env file, otherwise you can delete it. The .env file is responsible for your environment specific setup, like specifying the port, database address and location and their respective credentials. Your env file should look like the following

```ini
PORT=4000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=coins
DB_PASSWORD=sever1234
DB_PORT=5432
```


## Endpoints

The endpoint is found at *<your_server>:<port>/graphql

