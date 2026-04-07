import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { handleApiError } from "@/lib/api-error"
import { SupplierService } from "@/services/supplier.service"
import { supplierSchema } from "@/lib/validations"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const suppliers = await SupplierService.getAll()
    return NextResponse.json({ success: true, data: suppliers })
  } catch (error) {
    return handleApiError(error, "Failed to fetch suppliers")
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = supplierSchema.parse(body)

    const supplier = await SupplierService.create(validatedData)
    return NextResponse.json({ success: true, data: supplier }, { status: 201 })
  } catch (error) {
    return handleApiError(error, "Failed to create supplier")
  }
}
