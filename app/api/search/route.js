import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const author = searchParams.get("author") || ""
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const sortBy = searchParams.get("sortBy") || "relevance"
    const page = Number.parseInt(searchParams.get("page")) || 1
    const limit = Number.parseInt(searchParams.get("limit")) || 10

    const client = await clientPromise
    const db = client.db("shayari_hub")

    // Build search pipeline
    const pipeline = []

    // Match stage for filtering
    const matchStage = { visibility: "public" }

    // Text search
    if (query) {
      matchStage.$or = [{ title: { $regex: query, $options: "i" } }, { content: { $regex: query, $options: "i" } }]
    }

    // Author filter
    if (author) {
      const authorUser = await db
        .collection("users")
        .findOne({ username: { $regex: author, $options: "i" } }, { projection: { _id: 1 } })
      if (authorUser) {
        matchStage.authorId = authorUser._id
      } else {
        // No matching author found
        return NextResponse.json({
          shayaris: [],
          pagination: { page: 1, limit, total: 0, pages: 0 },
          suggestions: [],
        })
      }
    }

    // Date range filter
    if (dateFrom || dateTo) {
      matchStage.createdAt = {}
      if (dateFrom) {
        matchStage.createdAt.$gte = new Date(dateFrom)
      }
      if (dateTo) {
        matchStage.createdAt.$lte = new Date(dateTo + "T23:59:59.999Z")
      }
    }

    pipeline.push({ $match: matchStage })

    // Lookup author and likes
    pipeline.push(
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
          relevanceScore: query
            ? {
                $add: [
                  { $cond: [{ $regexMatch: { input: "$title", regex: query, options: "i" } }, 3, 0] },
                  { $cond: [{ $regexMatch: { input: "$content", regex: query, options: "i" } }, 1, 0] },
                ],
              }
            : 0,
        },
      },
      {
        $project: {
          "author.password": 0,
          "author.email": 0,
          likes: 0,
        },
      },
    )

    // Sorting
    let sortStage = {}
    switch (sortBy) {
      case "relevance":
        sortStage = query ? { relevanceScore: -1, likesCount: -1, createdAt: -1 } : { likesCount: -1, createdAt: -1 }
        break
      case "recent":
        sortStage = { createdAt: -1 }
        break
      case "popular":
        sortStage = { likesCount: -1, createdAt: -1 }
        break
      case "oldest":
        sortStage = { createdAt: 1 }
        break
      default:
        sortStage = { createdAt: -1 }
    }

    pipeline.push({ $sort: sortStage })

    // Get total count
    const countPipeline = [...pipeline, { $count: "total" }]
    const countResult = await db.collection("shayaris").aggregate(countPipeline).toArray()
    const total = countResult[0]?.total || 0

    // Add pagination
    const skip = (page - 1) * limit
    pipeline.push({ $skip: skip }, { $limit: limit })

    const shayaris = await db.collection("shayaris").aggregate(pipeline).toArray()

    // Generate search suggestions
    let suggestions = []
    if (query && shayaris.length < 5) {
      const suggestionPipeline = [
        {
          $match: {
            visibility: "public",
            $or: [
              { title: { $regex: query.substring(0, Math.max(1, query.length - 2)), $options: "i" } },
              { content: { $regex: query.substring(0, Math.max(1, query.length - 2)), $options: "i" } },
            ],
          },
        },
        { $project: { title: 1 } },
        { $limit: 5 },
      ]

      const suggestionResults = await db.collection("shayaris").aggregate(suggestionPipeline).toArray()
      suggestions = suggestionResults.map((s) => s.title).filter((title) => title.toLowerCase() !== query.toLowerCase())
    }

    return NextResponse.json({
      shayaris,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      suggestions: suggestions.slice(0, 3),
    })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
