import { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { AppError } from "@/lib/errors"

export function handleApiError(error: unknown, fallbackMessage: string) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status }
    )
  }

  if (error instanceof ZodError) {
    const firstIssue = error.issues[0]

    return NextResponse.json(
      { success: false, error: firstIssue?.message || "Invalid request data" },
      { status: 400 }
    )
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "A record with this value already exists" },
        { status: 409 }
      )
    }

    if (error.code === "P2003") {
      return NextResponse.json(
        { success: false, error: "Related records prevent this operation" },
        { status: 400 }
      )
    }

    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Record not found" },
        { status: 404 }
      )
    }
  }

  console.error(fallbackMessage, error)

  return NextResponse.json(
    { success: false, error: fallbackMessage },
    { status: 500 }
  )
}
