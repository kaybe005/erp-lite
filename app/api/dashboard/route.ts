import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { handleApiError } from "@/lib/api-error"
import { DashboardService } from "@/services/dashboard.service"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const stats = await DashboardService.getStats()
    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    return handleApiError(error, "Failed to fetch dashboard stats")
  }
}
