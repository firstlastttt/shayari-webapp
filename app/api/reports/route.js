import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"

export async function POST(request) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { shayariId, reason, description } = await request.json()

    if (!shayariId || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await connectDB()

    // Check if user already reported this shayari
    const existingReport = await db.collection("reports").findOne({
      shayariId,
      reportedBy: user.userId,
    })

    if (existingReport) {
      return NextResponse.json({ error: "Already reported" }, { status: 400 })
    }

    const report = {
      shayariId,
      reportedBy: user.userId,
      reason,
      description: description || "",
      status: "pending",
      createdAt: new Date(),
    }

    await db.collection("reports").insertOne(report)

    return NextResponse.json({ message: "Report submitted successfully" })
  } catch (error) {
    console.error("Report error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const db = await connectDB()
    const reports = await db
      .collection("reports")
      .aggregate([
        {
          $lookup: {
            from: "shayaris",
            localField: "shayariId",
            foreignField: "_id",
            as: "shayari",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "reportedBy",
            foreignField: "_id",
            as: "reporter",
          },
        },
        { $sort: { createdAt: -1 } },
      ])
      .toArray()

    return NextResponse.json(reports)
  } catch (error) {
    console.error("Get reports error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
