import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const type = searchParams.get("type") || "all" // 'titles', 'authors', 'all'

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    const client = await clientPromise
    const db = client.db("shayari_hub")

    const suggestions = []

    if (type === "titles" || type === "all") {
      // Get title suggestions
      const titleSuggestions = await db
        .collection("shayaris")
        .find(
          {
            visibility: "public",
            title: { $regex: query, $options: "i" },
          },
          { projection: { title: 1 } },
        )
        .limit(5)
        .toArray()

      suggestions.push(
        ...titleSuggestions.map((s) => ({
          type: "title",
          text: s.title,
          value: s.title,
        })),
      )
    }

    if (type === "authors" || type === "all") {
      // Get author suggestions
      const authorSuggestions = await db
        .collection("users")
        .find(
          {
            username: { $regex: query, $options: "i" },
            isActive: true,
          },
          { projection: { username: 1, profilePhoto: 1 } },
        )
        .limit(5)
        .toArray()

      suggestions.push(
        ...authorSuggestions.map((u) => ({
          type: "author",
          text: u.username,
          value: u.username,
          avatar: u.profilePhoto,
        })),
      )
    }

    // Remove duplicates and limit results
    const uniqueSuggestions = suggestions
      .filter((item, index, self) => index === self.findIndex((t) => t.text === item.text && t.type === item.type))
      .slice(0, 8)

    return NextResponse.json({ suggestions: uniqueSuggestions })
  } catch (error) {
    return NextResponse.json({ error: "Failed to get suggestions" }, { status: 500 })
  }
}
