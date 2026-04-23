import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { AnalyticsService } from "@/services/analytics.service"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const [trend, topProducts, summary] = await Promise.all([
      AnalyticsService.getMonthlyTrend(6),
      AnalyticsService.getTopProducts(),
      AnalyticsService.getSummary(),
    ])

    return NextResponse.json({
      success: true,
      data: { trend, topProducts, summary },
    })
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}
