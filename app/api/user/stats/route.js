import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request) {
  try {
    const token = request.cookies.get("token")?.value

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("shayari_hub")

    const userId = new ObjectId(decoded.userId)

    // Get user's shayaris count
    const totalShayaris = await db.collection("shayaris").countDocuments({ authorId: userId })

    // Get total likes on user's shayaris
    const userShayaris = await db.collection("shayaris").find({ authorId: userId }).toArray()
    const shayariIds = userShayaris.map((s) => s._id)

    const totalLikes = await db.collection("likes").countDocuments({
      shayariId: { $in: shayariIds },
    })

    // Get most liked shayari
    const mostLikedShayari = await db
      .collection("shayaris")
      .aggregate([
        { $match: { authorId: userId } },
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
            likesCount: { $size: "$likes" },
          },
        },
        { $sort: { likesCount: -1 } },
        { $limit: 1 },
      ])
      .toArray()

    return NextResponse.json({
      totalShayaris,
      totalLikes,
      followers: 0, // TODO: Implement followers system
      mostLikedShayari: mostLikedShayari[0] || null,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
