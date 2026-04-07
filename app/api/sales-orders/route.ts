import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { handleApiError } from "@/lib/api-error"
import { SalesOrderService } from "@/services/sales-order.service"
import { salesOrderSchema } from "@/lib/validations"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const orders = await SalesOrderService.getAll()
    return NextResponse.json({ success: true, data: orders })
  } catch (error) {
    return handleApiError(error, "Failed to fetch sales orders")
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = salesOrderSchema.parse(body)

    const order = await SalesOrderService.create(validatedData, session.user.id)
    return NextResponse.json({ success: true, data: order }, { status: 201 })
  } catch (error) {
    return handleApiError(error, "Failed to create sales order")
  }
}
