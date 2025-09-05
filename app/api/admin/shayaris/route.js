import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { checkAdminRole } from "@/lib/admin-middleware"

// GET - Fetch all shayaris for admin
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
    const visibility = searchParams.get("visibility") || "all"

    const client = await clientPromise
    const db = client.db("shayari_hub")

    const query = {}

    if (search) {
      query.$or = [{ title: { $regex: search, $options: "i" } }, { content: { $regex: search, $options: "i" } }]
    }

    if (visibility !== "all") {
      query.visibility = visibility
    }

    const skip = (page - 1) * limit

    const shayaris = await db
      .collection("shayaris")
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: "users",
            localField: "authorId",
            foreignField: "_id",
            as: "author",
          },
        },
        {
          $lookup: {
            from: "likes",
            localField: "_id",
            foreignField: "shayariId",
            as: "likes",
          },
        },
        {
          $addFields: {
            author: { $arrayElemAt: ["$author", 0] },
            likesCount: { $size: "$likes" },
          },
        },
        {
          $project: {
            "author.password": 0,
            "author.email": 0,
            likes: 0,
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ])
      .toArray()

    const total = await db.collection("shayaris").countDocuments(query)

    return NextResponse.json({
      shayaris,
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
