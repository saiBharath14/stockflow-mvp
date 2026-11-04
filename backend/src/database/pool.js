import mysql from 'mysql2/promise'
import databaseConfig from '../config/database.js'

const pool = mysql.createPool(databaseConfig)

export function execute(query, parameters = []) {
  return pool.execute(query, parameters)
}

export function getPool() {
  return pool
}

export async function getConnection() {
  return pool.getConnection()
}

export function closePool() {
  return pool.end()
}
