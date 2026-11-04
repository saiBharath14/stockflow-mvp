import dotenv from 'dotenv'

dotenv.config()

export function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured')
  }

  return process.env.JWT_SECRET
}

export const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1d'
