import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { handleApiError } from "@/lib/api-error"
import { SalesOrderService } from "@/services/sales-order.service"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const order = await SalesOrderService.getById(id)
    
    if (!order) {
      return NextResponse.json({ success: false, error: "Sales order not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    return handleApiError(error, "Failed to fetch sales order")
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !["CONFIRMED", "CANCELLED"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      )
    }

    const order = await SalesOrderService.updateStatus(id, status)
    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    return handleApiError(error, "Failed to update sales order")
  }
}
