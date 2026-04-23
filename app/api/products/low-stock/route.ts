import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { handleApiError } from "@/lib/api-error"
import { ProductService } from "@/services/product.service"

// GET /api/products/low-stock — products where quantityInStock <= reorderLevel
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const products = await ProductService.getLowStock()
    return NextResponse.json({ success: true, data: products })
  } catch (error) {
    return handleApiError(error, "Failed to fetch low-stock products")
  }
}
