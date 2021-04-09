# Buyiden Project - Backend

This is the backend application of the Buyiden Project. It habdles the Interaction with the database and therefore provides a graphql endpoint.


## Setup

### Install PostgreSQL and PostGIS

#### Linux (CentOS 8)

This installtion guide is taken from [this blogpost](https://people.planetpostgresql.org/devrim/index.php?/archives/107-Installing-PostGIS-3.1-and-PostgreSQL-13-on-CentOS-8.html) that was linked in the original PostGIS Documetnation. 

Install from repo:
```
dnf -y install https://download.postgresql.org/pub/repos/yum/reporpms/EL-8-x86_64/pgdg-redhat-repo-latest.noarch.rpm
```

Disable installed module:
```
dnf -qy module disable postgresql
```

Install EPEL repo RPM:
```
dnf -y install epel-release
```

Enable PowerTools (?):
```
dnf -y config-manager --set-enabled PowerTools
```

Install PostGIS:
```
dnf -y install postgis31_13
```

Then loginto postgresql by using: 

```
psql
```

and enable the extension by applying:
```
CREATE EXTENSION postgis;
```


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
DB_USER=user
DB_HOST=localhost
DB_NAME=your_database
DB_PASSWORD=password
DB_PORT=5432
```

## Hosting

### Running on the Server

There are various methods to keep a process running in the background when leaving the terminal. Do whatever you feel comfortable with.
In this case we are using PM2, a process managing program built on node.

Install: 
```
npm i pm2 -g
```

Run:
```
pm2 start node index.js --log log.txt
```

Inspect:
```
pm2 ls
```

Stop:
```
pm2 stop <id>
```

Remove:
```
pm2 delete <id>
```


### Running alongside Apache

To run the backend application in an apache environment, we need to use the apache server as a proxy.

```
    ProxyPass /graphql http://localhost:4000/
    LoadModule proxy_module modules/mod_proxy.so
```

## Endpoints

The endpoint is found at *<your_server>:<port>/graphql


# Database

To save the database on the current testserver (IKMK/severin) run the following command:

```cmd
cd /usr/pgsql-13/bin
./pg_dump -h 127.0.0.1 -U postgres  buya_data > ~/export.sql
```

To import it back into a test database or to restore a backup, run

```cmd
psql.exe -U postgres -h 127.0.0.1 coins < export.sql
```