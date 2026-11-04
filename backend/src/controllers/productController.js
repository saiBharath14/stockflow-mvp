import { execute } from '../database/pool.js'

const productFields = [
  'name',
  'sku',
  'description',
  'quantity_on_hand',
  'cost_price',
  'selling_price',
  'low_stock_threshold',
]

const productColumns = `
  id,
  organization_id,
  name,
  sku,
  description,
  quantity_on_hand,
  cost_price,
  selling_price,
  low_stock_threshold,
  created_at,
  updated_at
`

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0
}

function isNonNegativeNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function validatePrice(value) {
  return isNonNegativeNumber(value) && Number.isInteger(value * 100)
}

function validateProductFields(body, { requireNameAndSku = false } = {}) {
  const errors = {}
  const input = body && typeof body === 'object' ? body : {}

  if (Object.prototype.hasOwnProperty.call(input, 'organization_id')) {
    errors.organization_id = 'organization_id is assigned from the authenticated user'
  }

  if (requireNameAndSku || Object.prototype.hasOwnProperty.call(input, 'name')) {
    if (typeof input.name !== 'string' || input.name.trim().length === 0 || input.name.trim().length > 255) {
      errors.name = 'Name is required and must be 255 characters or fewer'
    }
  }

  if (requireNameAndSku || Object.prototype.hasOwnProperty.call(input, 'sku')) {
    if (typeof input.sku !== 'string' || input.sku.trim().length === 0 || input.sku.trim().length > 100) {
      errors.sku = 'SKU is required and must be 100 characters or fewer'
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, 'description') && input.description !== null &&
      (typeof input.description !== 'string' || input.description.length > 65535)) {
    errors.description = 'Description must be a string of 65535 characters or fewer'
  }

  if (Object.prototype.hasOwnProperty.call(input, 'quantity_on_hand') &&
      !isNonNegativeInteger(input.quantity_on_hand)) {
    errors.quantity_on_hand = 'Quantity must be a non-negative integer'
  }

  for (const field of ['cost_price', 'selling_price']) {
    if (Object.prototype.hasOwnProperty.call(input, field) && !validatePrice(input[field])) {
      errors[field] = 'Price must be a non-negative number with at most two decimal places'
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, 'low_stock_threshold') &&
      !isNonNegativeInteger(input.low_stock_threshold)) {
    errors.low_stock_threshold = 'Low-stock threshold must be a non-negative integer'
  }

  return errors
}

function normalizeProductInput(input) {
  const normalized = { ...input }

  if (typeof normalized.name === 'string') normalized.name = normalized.name.trim()
  if (typeof normalized.sku === 'string') normalized.sku = normalized.sku.trim()

  return normalized
}

function parseProductId(value) {
  const id = Number(value)
  return isPositiveInteger(id) ? id : null
}

function duplicateSkuResponse(response) {
  return response.status(409).json({
    success: false,
    message: 'A product with that SKU already exists in this organization',
  })
}

export async function createProduct(request, response, next) {
  const input = normalizeProductInput(request.body)
  const errors = validateProductFields(input, { requireNameAndSku: true })

  if (Object.keys(errors).length > 0) {
    return response.status(400).json({ success: false, message: 'Validation failed', errors })
  }

  const columns = ['organization_id', 'name', 'sku']
  const values = [request.user.organizationId, input.name, input.sku]

  for (const field of productFields.slice(2)) {
    if (Object.prototype.hasOwnProperty.call(input, field)) {
      columns.push(field)
      values.push(input[field])
    }
  }

  const placeholders = columns.map(() => '?').join(', ')

  try {
    const [result] = await execute(
      `INSERT INTO products (${columns.join(', ')}) VALUES (${placeholders})`,
      values,
    )
    const [products] = await execute(
      `SELECT ${productColumns} FROM products WHERE id = ? AND organization_id = ?`,
      [result.insertId, request.user.organizationId],
    )

    return response.status(201).json({ success: true, product: products[0] })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return duplicateSkuResponse(response)
    return next(error)
  }
}

export async function getProducts(request, response, next) {
  try {
    const [products] = await execute(
      `SELECT ${productColumns}
       FROM products
       WHERE organization_id = ?
       ORDER BY created_at DESC, id DESC`,
      [request.user.organizationId],
    )

    return response.json({ success: true, products })
  } catch (error) {
    return next(error)
  }
}

export async function getProductById(request, response, next) {
  const productId = parseProductId(request.params.id)

  if (!productId) {
    return response.status(400).json({
      success: false,
      message: 'Product ID must be a positive integer',
    })
  }

  try {
    const [products] = await execute(
      `SELECT ${productColumns}
       FROM products
       WHERE id = ? AND organization_id = ?`,
      [productId, request.user.organizationId],
    )

    if (products.length === 0) {
      return response.status(404).json({ success: false, message: 'Product not found' })
    }

    return response.json({ success: true, product: products[0] })
  } catch (error) {
    return next(error)
  }
}

export async function updateProduct(request, response, next) {
  const productId = parseProductId(request.params.id)

  if (!productId) {
    return response.status(400).json({
      success: false,
      message: 'Product ID must be a positive integer',
    })
  }

  const input = normalizeProductInput(request.body)
  const fieldsToUpdate = productFields.filter((field) =>
    Object.prototype.hasOwnProperty.call(input, field),
  )

  const errors = validateProductFields(input)
  if (Object.keys(errors).length > 0) {
    return response.status(400).json({ success: false, message: 'Validation failed', errors })
  }

  if (fieldsToUpdate.length === 0) {
    return response.status(400).json({
      success: false,
      message: 'At least one product field is required',
    })
  }

  const assignments = fieldsToUpdate.map((field) => `${field} = ?`).join(', ')
  const values = fieldsToUpdate.map((field) => input[field])
  values.push(productId, request.user.organizationId)

  try {
    const [result] = await execute(
      `UPDATE products
       SET ${assignments}
       WHERE id = ? AND organization_id = ?`,
      values,
    )

    if (result.affectedRows === 0) {
      return response.status(404).json({ success: false, message: 'Product not found' })
    }

    const [products] = await execute(
      `SELECT ${productColumns} FROM products WHERE id = ? AND organization_id = ?`,
      [productId, request.user.organizationId],
    )

    return response.json({ success: true, product: products[0] })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return duplicateSkuResponse(response)
    return next(error)
  }
}

export async function deleteProduct(request, response, next) {
  const productId = parseProductId(request.params.id)

  if (!productId) {
    return response.status(400).json({
      success: false,
      message: 'Product ID must be a positive integer',
    })
  }

  try {
    const [result] = await execute(
      'DELETE FROM products WHERE id = ? AND organization_id = ?',
      [productId, request.user.organizationId],
    )

    if (result.affectedRows === 0) {
      return response.status(404).json({ success: false, message: 'Product not found' })
    }

    return response.json({ success: true, message: 'Product deleted successfully' })
  } catch (error) {
    return next(error)
  }
}
