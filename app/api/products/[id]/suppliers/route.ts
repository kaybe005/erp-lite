import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { handleApiError } from "@/lib/api-error"
import { ProductService } from "@/services/product.service"
import { supplierProductSyncSchema } from "@/lib/validations"

// GET /api/products/[id]/suppliers — list suppliers linked to this product
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const links = await ProductService.getLinkedSuppliers(id)
    return NextResponse.json({ success: true, data: links.map((l) => l.supplier) })
  } catch (error) {
    return handleApiError(error, "Failed to fetch linked suppliers")
  }
}

// PUT /api/products/[id]/suppliers — replace all supplier links for this product
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
    const { supplierIds } = supplierProductSyncSchema.parse(body)

    await ProductService.syncSupplierLinks(id, supplierIds)
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "Failed to update supplier links")
  }
}
