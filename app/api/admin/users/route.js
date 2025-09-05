import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { checkAdminRole } from "@/lib/admin-middleware"

// GET - Fetch all users for admin
export async function GET(request) {
  const authCheck = await checkAdminRole("admin")(request)
  if (!authCheck.success) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page")) || 1
    const limit = Number.parseInt(searchParams.get("limit")) || 20
    const search = searchParams.get("search") || ""

    const client = await clientPromise
    const db = client.db("shayari_hub")

    let query = {}
    if (search) {
      query = {
        $or: [{ username: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }],
      }
    }

    const skip = (page - 1) * limit

    const users = await db
      .collection("users")
      .find(query, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    // Get shayari counts for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const shayariCount = await db.collection("shayaris").countDocuments({ authorId: user._id })
        const likesCount = await db.collection("likes").countDocuments({
          shayariId: { $in: await db.collection("shayaris").distinct("_id", { authorId: user._id }) },
        })
        return { ...user, shayariCount, likesCount }
      }),
    )

    const total = await db.collection("users").countDocuments(query)

    return NextResponse.json({
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
