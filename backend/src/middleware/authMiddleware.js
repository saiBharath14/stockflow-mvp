import jwt from 'jsonwebtoken'
import { verifyToken } from '../utils/jwt.js'

export function authenticateToken(request, response, next) {
  const authorization = request.get('authorization')
  const [scheme, token] = authorization ? authorization.split(' ') : []

  if (scheme !== 'Bearer' || !token) {
    return response.status(401).json({
      success: false,
      message: 'Authorization Bearer token is required',
    })
  }

  try {
    const payload = verifyToken(token)

    if (
      typeof payload !== 'object' ||
      payload === null ||
      payload.userId === undefined ||
      payload.organizationId === undefined
    ) {
      return response.status(401).json({
        success: false,
        message: 'Invalid token',
      })
    }

    request.user = {
      id: payload.userId,
      organizationId: payload.organizationId,
    }
    return next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return response.status(401).json({
        success: false,
        message: 'Token expired',
      })
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return response.status(401).json({
        success: false,
        message: 'Invalid token',
      })
    }

    return next(error)
  }
}
