import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { handleApiError } from "@/lib/api-error"
import { UserService } from "@/services/user.service"
import { createUserSchema } from "@/lib/validations"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can view users
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const users = await UserService.getAll()
    return NextResponse.json({ success: true, data: users })
  } catch (error) {
    return handleApiError(error, "Failed to fetch users")
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can create users
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    const user = await UserService.create(validatedData)
    return NextResponse.json({ success: true, data: user }, { status: 201 })
  } catch (error) {
    return handleApiError(error, "Failed to create user")
  }
}
