import bcrypt from 'bcrypt'
import { getJwtSecret } from '../config/auth.js'
import { getConnection, execute } from '../database/pool.js'
import { generateToken } from '../utils/jwt.js'

const passwordRounds = 12

function safeUser(user) {
  return {
    id: user.id,
    organizationId: user.organization_id,
    name: user.name,
    email: user.email,
    createdAt: user.created_at,
  }
}

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

function validateRegistration({ name, email, password, organizationName }) {
  const errors = {}
  const normalizedEmail = normalizeEmail(email)

  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 255) {
    errors.name = 'Name must be between 2 and 255 characters'
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 255) {
    errors.email = 'A valid email is required'
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
    errors.password = 'Password must be between 8 and 72 characters'
  }
  if (
    typeof organizationName !== 'string' ||
    organizationName.trim().length < 2 ||
    organizationName.trim().length > 255
  ) {
    errors.organizationName = 'Organization name must be between 2 and 255 characters'
  }

  return { errors, normalizedEmail }
}

export async function register(request, response, next) {
  const { name, email, password, organizationName } = request.body || {}
  const { errors, normalizedEmail } = validateRegistration({
    name,
    email,
    password,
    organizationName,
  })

  if (Object.keys(errors).length > 0) {
    return response.status(400).json({ success: false, message: 'Validation failed', errors })
  }

  let connection
  try {
    getJwtSecret()
    connection = await getConnection()
  } catch (error) {
    return next(error)
  }

  try {
    await connection.beginTransaction()

    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [normalizedEmail],
    )
    if (existingUsers.length > 0) {
      await connection.rollback()
      return response.status(409).json({
        success: false,
        message: 'An account with that email already exists',
      })
    }

    const passwordHash = await bcrypt.hash(password, passwordRounds)
    const [organizationResult] = await connection.execute(
      'INSERT INTO organizations (name) VALUES (?)',
      [organizationName.trim()],
    )
    const organizationId = organizationResult.insertId

    const [userResult] = await connection.execute(
      `INSERT INTO users (organization_id, name, email, password_hash)
       VALUES (?, ?, ?, ?)`,
      [organizationId, name.trim(), normalizedEmail, passwordHash],
    )
    const userId = userResult.insertId

    await connection.execute(
      'INSERT INTO settings (organization_id) VALUES (?)',
      [organizationId],
    )

    await connection.commit()

    const user = {
      id: userId,
      organization_id: organizationId,
      name: name.trim(),
      email: normalizedEmail,
      created_at: new Date(),
    }

    return response.status(201).json({
      success: true,
      token: generateToken({ userId, organizationId }),
      user: safeUser(user),
    })
  } catch (error) {
    await connection.rollback()

    if (error.code === 'ER_DUP_ENTRY') {
      return response.status(409).json({
        success: false,
        message: 'An account with that email already exists',
      })
    }

    return next(error)
  } finally {
    connection.release()
  }
}

export async function login(request, response, next) {
  const { email, password } = request.body || {}
  const normalizedEmail = normalizeEmail(email)

  if (!normalizedEmail || typeof password !== 'string' || password.length === 0) {
    return response.status(400).json({
      success: false,
      message: 'Email and password are required',
    })
  }

  try {
    getJwtSecret()
    const [users] = await execute(
      `SELECT id, organization_id, name, email, password_hash, created_at
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [normalizedEmail],
    )
    const user = users[0]

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return response.status(401).json({
        success: false,
        message: 'Invalid email or password',
      })
    }

    return response.json({
      success: true,
      token: generateToken({
        userId: user.id,
        organizationId: user.organization_id,
      }),
      user: safeUser(user),
    })
  } catch (error) {
    return next(error)
  }
}
