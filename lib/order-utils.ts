import { randomUUID } from "crypto"

export function aggregateItemQuantities(
  items: Array<{ productId: string; quantity: number }>
) {
  return items.reduce((accumulator, item) => {
    const currentQuantity = accumulator.get(item.productId) ?? 0
    accumulator.set(item.productId, currentQuantity + item.quantity)
    return accumulator
  }, new Map<string, number>())
}

export function generateOrderNumber(prefix: "PO" | "SO") {
  const timestamp = new Date().toISOString().replace(/[^\d]/g, "").slice(0, 14)
  const suffix = randomUUID().slice(0, 8).toUpperCase()

  return `${prefix}-${timestamp}-${suffix}`
}
