import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { handleApiError } from "@/lib/api-error"
import { prisma } from "@/lib/db"

// GET /api/suppliers/[id]/products — list products linked to this supplier
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
    const links = await prisma.supplierProduct.findMany({
      where: { supplierId: id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            unitPrice: true,
            quantityInStock: true,
            reorderLevel: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: links.map((l) => l.product) })
  } catch (error) {
    return handleApiError(error, "Failed to fetch linked products")
  }
}
