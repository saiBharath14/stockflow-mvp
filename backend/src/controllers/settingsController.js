import { execute } from '../database/pool.js'

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0
}

function settingsResponse(response, settings) {
  return response.json({
    success: true,
    settings: {
      organization_id: settings.organization_id,
      default_low_stock_threshold: Number(settings.default_low_stock_threshold),
    },
  })
}

export async function getSettings(request, response, next) {
  const organizationId = request.user.organizationId

  try {
    const [rows] = await execute(
      `SELECT organization_id, default_low_stock_threshold
       FROM settings
       WHERE organization_id = ?
       LIMIT 1`,
      [organizationId],
    )

    if (rows.length === 0) {
      return response.status(404).json({ success: false, message: 'Settings not found' })
    }

    return settingsResponse(response, rows[0])
  } catch (error) {
    return next(error)
  }
}

export async function updateSettings(request, response, next) {
  const organizationId = request.user.organizationId
  const threshold = request.body?.default_low_stock_threshold

  if (!isNonNegativeInteger(threshold)) {
    return response.status(400).json({
      success: false,
      message: 'default_low_stock_threshold must be a non-negative integer',
    })
  }

  try {
    await execute(
      `INSERT INTO settings (organization_id, default_low_stock_threshold)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE
         default_low_stock_threshold = VALUES(default_low_stock_threshold)`,
      [organizationId, threshold],
    )

    const [rows] = await execute(
      `SELECT organization_id, default_low_stock_threshold
       FROM settings
       WHERE organization_id = ?
       LIMIT 1`,
      [organizationId],
    )

    if (rows.length === 0) {
      return response.status(404).json({ success: false, message: 'Settings not found' })
    }

    return settingsResponse(response, rows[0])
  } catch (error) {
    return next(error)
  }
}
