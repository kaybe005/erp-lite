import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { handleApiError } from "@/lib/api-error"
import { PurchaseOrderService } from "@/services/purchase-order.service"
import { purchaseOrderSchema } from "@/lib/validations"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const orders = await PurchaseOrderService.getAll()
    return NextResponse.json({ success: true, data: orders })
  } catch (error) {
    return handleApiError(error, "Failed to fetch purchase orders")
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = purchaseOrderSchema.parse(body)

    const order = await PurchaseOrderService.create(validatedData, session.user.id)
    return NextResponse.json({ success: true, data: order }, { status: 201 })
  } catch (error) {
    return handleApiError(error, "Failed to create purchase order")
  }
}
