"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Navbar from "@/components/navbar"
import ShayariCard from "@/components/shayari-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { PenTool, Heart, Users, BookOpen, Plus, TrendingUp } from "lucide-react"

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({
    totalShayaris: 0,
    totalLikes: 0,
    followers: 0,
    mostLikedShayari: null,
  })
  const [recentShayaris, setRecentShayaris] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)

        const statsResponse = await fetch("/api/user/stats")
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData)
        }

        // Fetch user's recent shayaris
        const shayarisResponse = await fetch(`/api/shayaris?userId=${data.user._id}&visibility=all&limit=3`)
        if (shayarisResponse.ok) {
          const shayarisData = await shayarisResponse.json()
          setRecentShayaris(shayarisData.shayaris)
        }
      } else {
        router.push("/login")
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.profilePhoto || "/placeholder.svg"} alt={user.username} />
                <AvatarFallback className="bg-purple-100 text-purple-700 text-xl">
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.username}!</h1>
                <p className="text-gray-600 mt-1">Ready to share your thoughts through poetry?</p>
                {user.role !== "user" && (
                  <Badge variant="secondary" className="mt-2">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                )}
              </div>
            </div>

            <Link href="/create">
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Write New Shayari
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-purple-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shayaris</CardTitle>
              <BookOpen className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">{stats.totalShayaris}</div>
              <p className="text-xs text-muted-foreground">Your published works</p>
            </CardContent>
          </Card>

          <Card className="border-pink-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
              <Heart className="h-4 w-4 text-pink-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-700">{stats.totalLikes}</div>
              <p className="text-xs text-muted-foreground">Appreciation received</p>
            </CardContent>
          </Card>

          <Card className="border-orange-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Followers</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">{stats.followers}</div>
              <p className="text-xs text-muted-foreground">People following you</p>
            </CardContent>
          </Card>

          <Card className="border-green-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Shayari</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{stats.mostLikedShayari?.likesCount || 0}</div>
              <p className="text-xs text-muted-foreground">{stats.mostLikedShayari ? "Most liked" : "No likes yet"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link href="/create">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-3 p-6">
                <PenTool className="h-8 w-8 text-purple-600" />
                <div>
                  <h3 className="font-semibold">Write Shayari</h3>
                  <p className="text-sm text-muted-foreground">Create new poetry</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/profile">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-3 p-6">
                <Users className="h-8 w-8 text-pink-600" />
                <div>
                  <h3 className="font-semibold">My Profile</h3>
                  <p className="text-sm text-muted-foreground">Edit your profile</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/my-shayaris">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-3 p-6">
                <BookOpen className="h-8 w-8 text-orange-600" />
                <div>
                  <h3 className="font-semibold">My Shayaris</h3>
                  <p className="text-sm text-muted-foreground">Manage your posts</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/explore">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-3 p-6">
                <Heart className="h-8 w-8 text-red-600" />
                <div>
                  <h3 className="font-semibold">Explore</h3>
                  <p className="text-sm text-muted-foreground">Discover poetry</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest shayaris and interactions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentShayaris.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity yet.</p>
                <p className="text-sm">Start by writing your first shayari!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentShayaris.map((shayari) => (
                  <ShayariCard key={shayari._id} shayari={shayari} currentUser={user} />
                ))}
                <div className="text-center pt-4">
                  <Link href="/my-shayaris">
                    <Button variant="outline">View All My Shayaris</Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
