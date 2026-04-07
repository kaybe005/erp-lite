import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { handleApiError } from "@/lib/api-error"
import { ProductService } from "@/services/product.service"
import { productSchema } from "@/lib/validations"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const products = await ProductService.getAll()
    return NextResponse.json({ success: true, data: products })
  } catch (error) {
    return handleApiError(error, "Failed to fetch products")
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = productSchema.parse(body)

    const product = await ProductService.create(validatedData)
    return NextResponse.json({ success: true, data: product }, { status: 201 })
  } catch (error) {
    return handleApiError(error, "Failed to create product")
  }
}
