import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

// GET - Fetch public shayaris for explore page
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page")) || 1
    const limit = Number.parseInt(searchParams.get("limit")) || 10
    const userId = searchParams.get("userId")
    const visibility = searchParams.get("visibility") || "public"

    const client = await clientPromise
    const db = client.db("shayari_hub")

    const query = {}

    if (userId) {
      query.authorId = new ObjectId(userId)
      // If fetching user's own shayaris, include both public and private
      if (visibility === "all") {
        // No visibility filter
      } else {
        query.visibility = visibility
      }
    } else {
      // For public feed, only show public shayaris
      query.visibility = "public"
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
        { $sort: { likesCount: -1, createdAt: -1 } },
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

// POST - Create new shayari
export async function POST(request) {
  try {
    const token = request.cookies.get("token")?.value

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { title, content, visibility } = await request.json()

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    if (!["public", "private"].includes(visibility)) {
      return NextResponse.json({ error: "Invalid visibility option" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("shayari_hub")

    const newShayari = {
      title: title.trim(),
      content: content.trim(),
      visibility,
      authorId: new ObjectId(decoded.userId),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("shayaris").insertOne(newShayari)

    return NextResponse.json(
      {
        message: "Shayari created successfully",
        shayari: { ...newShayari, _id: result.insertedId },
      },
      { status: 201 },
    )
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
