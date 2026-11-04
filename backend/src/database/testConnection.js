import { closePool, execute } from './pool.js'

try {
  await execute('SELECT 1 AS connected')
  console.log('Database connection successful.')
} catch (error) {
  console.error('Database connection failed:', error.message)
  process.exitCode = 1
} finally {
  await closePool()
}
