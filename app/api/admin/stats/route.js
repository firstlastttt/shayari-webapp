import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { checkAdminRole } from "@/lib/admin-middleware"

export async function GET(request) {
  const authCheck = await checkAdminRole("admin")(request)
  if (!authCheck.success) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
  }

  try {
    const client = await clientPromise
    const db = client.db("shayari_hub")

    // Get comprehensive site statistics
    const [
      totalUsers,
      activeUsers,
      bannedUsers,
      totalShayaris,
      publicShayaris,
      privateShayaris,
      totalLikes,
      adminUsers,
      recentUsers,
      topShayaris,
    ] = await Promise.all([
      db.collection("users").countDocuments(),
      db.collection("users").countDocuments({ isActive: true }),
      db.collection("users").countDocuments({ isActive: false }),
      db.collection("shayaris").countDocuments(),
      db.collection("shayaris").countDocuments({ visibility: "public" }),
      db.collection("shayaris").countDocuments({ visibility: "private" }),
      db.collection("likes").countDocuments(),
      db.collection("users").countDocuments({ role: { $in: ["admin", "super_admin"] } }),

      // Recent users (last 7 days)
      db
        .collection("users")
        .countDocuments({
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        }),

      // Top 5 most liked shayaris
      db
        .collection("shayaris")
        .aggregate([
          {
            $lookup: {
              from: "likes",
              localField: "_id",
              foreignField: "shayariId",
              as: "likes",
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "authorId",
              foreignField: "_id",
              as: "author",
            },
          },
          {
            $addFields: {
              likesCount: { $size: "$likes" },
              author: { $arrayElemAt: ["$author", 0] },
            },
          },
          {
            $project: {
              title: 1,
              likesCount: 1,
              "author.username": 1,
              createdAt: 1,
            },
          },
          { $sort: { likesCount: -1 } },
          { $limit: 5 },
        ])
        .toArray(),
    ])

    return NextResponse.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        banned: bannedUsers,
        admins: adminUsers,
        recent: recentUsers,
      },
      shayaris: {
        total: totalShayaris,
        public: publicShayaris,
        private: privateShayaris,
      },
      engagement: {
        totalLikes,
        avgLikesPerShayari: totalShayaris > 0 ? (totalLikes / totalShayaris).toFixed(2) : 0,
      },
      topShayaris,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
