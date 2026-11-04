import { execute } from '../database/pool.js'

const effectiveThreshold = 'COALESCE(p.low_stock_threshold, s.default_low_stock_threshold, 5)'

export async function getSummary(request, response, next) {
  const organizationId = request.user.organizationId

  try {
    const [metrics] = await execute(
      `SELECT
         COUNT(*) AS total_products,
         COALESCE(SUM(p.quantity_on_hand), 0) AS total_quantity,
         COALESCE(
           SUM(
             CASE
               WHEN p.quantity_on_hand <= ${effectiveThreshold} THEN 1
               ELSE 0
             END
           ),
           0
         ) AS low_stock_count
       FROM products p
       LEFT JOIN settings s
         ON s.organization_id = p.organization_id
       WHERE p.organization_id = ?`,
      [organizationId],
    )

    const [lowStockProducts] = await execute(
      `SELECT
         p.id,
         p.name,
         p.sku,
         p.quantity_on_hand,
         ${effectiveThreshold} AS effective_low_stock_threshold
       FROM products p
       LEFT JOIN settings s
         ON s.organization_id = p.organization_id
       WHERE p.organization_id = ?
         AND p.quantity_on_hand <= ${effectiveThreshold}
       ORDER BY p.quantity_on_hand ASC, p.name ASC, p.id ASC`,
      [organizationId],
    )

    const summary = metrics[0]

    return response.json({
      success: true,
      summary: {
        total_products: Number(summary.total_products),
        total_quantity: Number(summary.total_quantity),
        low_stock_count: Number(summary.low_stock_count),
        low_stock_products: lowStockProducts,
      },
    })
  } catch (error) {
    return next(error)
  }
}
