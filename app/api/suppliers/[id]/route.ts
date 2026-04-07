import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { handleApiError } from "@/lib/api-error"
import { SupplierService } from "@/services/supplier.service"
import { supplierSchema } from "@/lib/validations"

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
    const supplier = await SupplierService.getById(id)
    
    if (!supplier) {
      return NextResponse.json({ success: false, error: "Supplier not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: supplier })
  } catch (error) {
    return handleApiError(error, "Failed to fetch supplier")
  }
}

export async function PUT(
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
    const validatedData = supplierSchema.partial().parse(body)

    const supplier = await SupplierService.update(id, validatedData)
    return NextResponse.json({ success: true, data: supplier })
  } catch (error) {
    return handleApiError(error, "Failed to update supplier")
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    await SupplierService.delete(id)
    return NextResponse.json({ success: true, message: "Supplier deleted" })
  } catch (error) {
    return handleApiError(error, "Failed to delete supplier")
  }
}
