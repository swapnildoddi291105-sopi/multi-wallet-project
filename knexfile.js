module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL || {
      host: '127.0.0.1',
      user: 'postgres',
      password: 'postgres',
      database: 'multiwallet'
    },
    migrations: {
      directory: './migrations'
    }
  }
};