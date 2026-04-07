import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { handleApiError } from "@/lib/api-error"
import { UserService } from "@/services/user.service"
import { userSchema } from "@/lib/validations"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can view user details
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const user = await UserService.getById(id)
    
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    return handleApiError(error, "Failed to fetch user")
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

    // Only admins can update users
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = userSchema.partial().parse(body)

    if (id === session.user.id) {
      if (validatedData.isActive === false) {
        return NextResponse.json(
          { success: false, error: "Cannot deactivate your own account" },
          { status: 400 }
        )
      }

      if (validatedData.role && validatedData.role !== "ADMIN") {
        return NextResponse.json(
          { success: false, error: "Cannot remove your own admin role" },
          { status: 400 }
        )
      }
    }

    const user = await UserService.update(id, validatedData)
    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    return handleApiError(error, "Failed to update user")
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

    // Only admins can delete users
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    
    // Prevent self-deletion
    if (id === session.user.id) {
      return NextResponse.json(
        { success: false, error: "Cannot delete your own account" },
        { status: 400 }
      )
    }

    await UserService.delete(id)
    return NextResponse.json({ success: true, message: "User deleted" })
  } catch (error) {
    return handleApiError(error, "Failed to delete user")
  }
}
