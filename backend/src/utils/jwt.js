import jwt from 'jsonwebtoken'
import { getJwtSecret, jwtExpiresIn } from '../config/auth.js'

export function generateToken({ userId, organizationId }) {
  return jwt.sign({ userId, organizationId }, getJwtSecret(), {
    expiresIn: jwtExpiresIn,
  })
}

export function verifyToken(token) {
  return jwt.verify(token, getJwtSecret())
}
