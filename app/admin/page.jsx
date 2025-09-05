"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Shield,
  Users,
  BookOpen,
  Heart,
  Search,
  MoreVertical,
  Ban,
  CheckCircle,
  Trash2,
  TrendingUp,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [shayaris, setShayaris] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchUsers, setSearchUsers] = useState("")
  const [searchShayaris, setSearchShayaris] = useState("")
  const router = useRouter()

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json()
        if (data.user.role !== "admin" && data.user.role !== "super_admin") {
          router.push("/dashboard")
          return
        }
        setUser(data.user)
        await Promise.all([fetchStats(), fetchUsers(), fetchShayaris()])
      } else {
        router.push("/login")
      }
    } catch (error) {
      setError("Failed to load admin dashboard")
      router.push("/dashboard")
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users?limit=50")
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }

  const fetchShayaris = async () => {
    try {
      const response = await fetch("/api/admin/shayaris?limit=50")
      if (response.ok) {
        const data = await response.json()
        setShayaris(data.shayaris)
      }
    } catch (error) {
      console.error("Failed to fetch shayaris:", error)
    }
  }

  const handleUserAction = async (userId, action) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        await fetchUsers()
        await fetchStats()
      } else {
        const data = await response.json()
        setError(data.error)
      }
    } catch (error) {
      setError("Failed to update user")
    }
  }

  const handleDeleteShayari = async (shayariId) => {
    if (!confirm("Are you sure you want to delete this shayari?")) return

    try {
      const response = await fetch(`/api/admin/shayaris/${shayariId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchShayaris()
        await fetchStats()
      } else {
        const data = await response.json()
        setError(data.error)
      }
    } catch (error) {
      setError("Failed to delete shayari")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchUsers.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUsers.toLowerCase()),
  )

  const filteredShayaris = shayaris.filter(
    (s) =>
      s.title.toLowerCase().includes(searchShayaris.toLowerCase()) ||
      s.content.toLowerCase().includes(searchShayaris.toLowerCase()) ||
      s.author.username.toLowerCase().includes(searchShayaris.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Shield className="h-8 w-8 text-orange-600" />
            Admin Dashboard
          </h1>
          <p className="text-gray-600">Manage users, content, and monitor site activity</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Overview */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="border-blue-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">{stats.users.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.users.active} active, {stats.users.banned} banned
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Shayaris</CardTitle>
                <BookOpen className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">{stats.shayaris.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.shayaris.public} public, {stats.shayaris.private} private
                </p>
              </CardContent>
            </Card>

            <Card className="border-pink-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
                <Heart className="h-4 w-4 text-pink-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-pink-700">{stats.engagement.totalLikes}</div>
                <p className="text-xs text-muted-foreground">{stats.engagement.avgLikesPerShayari} avg per shayari</p>
              </CardContent>
            </Card>

            <Card className="border-orange-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Users</CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-700">{stats.users.recent}</div>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="content">Content Moderation</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts, ban/unban users, and monitor activity</CardDescription>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search users..."
                      value={searchUsers}
                      onChange={(e) => setSearchUsers(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Stats</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.profilePhoto || "/placeholder.svg"} alt={user.username} />
                              <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                                {user.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{user.username}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.role === "super_admin" ? "default" : user.role === "admin" ? "secondary" : "outline"
                            }
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? "default" : "destructive"}>
                            {user.isActive ? "Active" : "Banned"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <p>{user.shayariCount} shayaris</p>
                            <p>{user.likesCount} likes</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {user.isActive ? (
                                <DropdownMenuItem
                                  onClick={() => handleUserAction(user._id, "ban")}
                                  className="text-red-600"
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  Ban User
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleUserAction(user._id, "unban")}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Unban User
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Moderation</CardTitle>
                <CardDescription>Review and moderate shayaris across the platform</CardDescription>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search shayaris..."
                      value={searchShayaris}
                      onChange={(e) => setSearchShayaris(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredShayaris.map((shayari) => (
                    <Card key={shayari._id} className="border-l-4 border-l-orange-400">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={shayari.author.profilePhoto || "/placeholder.svg"}
                                alt={shayari.author.username}
                              />
                              <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                                {shayari.author.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{shayari.author.username}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(shayari.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={shayari.visibility === "public" ? "default" : "secondary"}>
                              {shayari.visibility}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleDeleteShayari(shayari._id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Shayari
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <h3 className="font-bold text-lg mb-2">{shayari.title}</h3>
                        <div className="bg-gradient-to-r from-orange-50 to-red-50 p-3 rounded-lg border-l-4 border-orange-400 mb-3">
                          <p className="text-gray-800 leading-relaxed whitespace-pre-line text-sm">
                            {shayari.content.length > 200 ? shayari.content.substring(0, 200) + "..." : shayari.content}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {shayari.likesCount} likes
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
