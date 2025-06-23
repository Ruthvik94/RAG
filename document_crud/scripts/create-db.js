const { Client } = require('pg');

const config = {
  user: 'rag_user',
  host: 'localhost',
  password: '12345',
  port: 5432,
  database: 'postgres', // connect to default db to create new one
};

const dbName = 'document_crud';

(async () => {
  const client = new Client(config);
  await client.connect();

  const res = await client.query(`SELECT 1 FROM pg_database WHERE datname='${dbName}'`);
  if (res.rowCount === 0) {
    await client.query(`CREATE DATABASE "${dbName}"`);
    console.log(`Database "${dbName}" created.`);
  } else {
    console.log(`Database "${dbName}" already exists.`);
  }

  await client.end();
})();