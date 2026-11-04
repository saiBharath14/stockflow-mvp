import dotenv from 'dotenv'

dotenv.config()

const databaseConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}

for (const [key, value] of Object.entries({
  DB_HOST: databaseConfig.host,
  DB_PORT: databaseConfig.port,
  DB_USER: databaseConfig.user,
  DB_NAME: databaseConfig.database,
})) {
  if (!value) {
    throw new Error(`Missing required database environment variable: ${key}`)
  }
}

export default databaseConfig
