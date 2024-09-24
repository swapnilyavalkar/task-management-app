const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',  // or the host where your database is running
    database: 'task_management',
    password: 'nonSecure09$',  // Replace with your actual password
    port: 5432,  // Default PostgreSQL port
});

pool.on('connect', () => {
    console.log('Connected to the PostgreSQL database');
  });
  
  module.exports = {
    query: (text, params) => pool.query(text, params),
  };