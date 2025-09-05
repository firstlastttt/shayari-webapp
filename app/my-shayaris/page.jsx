"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Navbar from "@/components/navbar"
import ShayariCard from "@/components/shayari-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, Plus, Eye, EyeOff } from "lucide-react"

export default function MyShayarisPage() {
  const [user, setUser] = useState(null)
  const [shayaris, setShayaris] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const router = useRouter()

  useEffect(() => {
    fetchUserAndShayaris()
  }, [])

  const fetchUserAndShayaris = async () => {
    try {
      // Fetch user data
      const userResponse = await fetch("/api/auth/me")
      if (!userResponse.ok) {
        router.push("/login")
        return
      }

      const userData = await userResponse.json()
      setUser(userData.user)

      // Fetch user's shayaris
      const shayarisResponse = await fetch(`/api/shayaris?userId=${userData.user._id}&visibility=all`)
      if (shayarisResponse.ok) {
        const shayarisData = await shayarisResponse.json()
        setShayaris(shayarisData.shayaris)
      }
    } catch (error) {
      setError("Failed to load your shayaris")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (shayari) => {
    router.push(`/create?edit=${shayari._id}`)
  }

  const handleDelete = async (shayariId) => {
    if (!confirm("Are you sure you want to delete this shayari?")) return

    try {
      const response = await fetch(`/api/shayaris/${shayariId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setShayaris((prev) => prev.filter((s) => s._id !== shayariId))
      } else {
        setError("Failed to delete shayari")
      }
    } catch (error) {
      setError("Failed to delete shayari")
    }
  }

  const filteredShayaris = shayaris.filter((shayari) => {
    if (activeTab === "all") return true
    return shayari.visibility === activeTab
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-purple-600" />
                My Shayaris
              </h1>
              <p className="text-gray-600">Manage and organize your poetry collection</p>
            </div>

            <Link href="/create">
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Write New Shayari
              </Button>
            </Link>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All ({shayaris.length})</TabsTrigger>
              <TabsTrigger value="public" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Public ({shayaris.filter((s) => s.visibility === "public").length})
              </TabsTrigger>
              <TabsTrigger value="private" className="flex items-center gap-2">
                <EyeOff className="h-4 w-4" />
                Private ({shayaris.filter((s) => s.visibility === "private").length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-6">
              {filteredShayaris.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <CardTitle className="mb-2">
                      {activeTab === "all" ? "No shayaris yet" : `No ${activeTab} shayaris yet`}
                    </CardTitle>
                    <CardDescription className="mb-4">
                      {activeTab === "all"
                        ? "Start your poetry journey by writing your first shayari"
                        : `You haven't written any ${activeTab} shayaris yet`}
                    </CardDescription>
                    <Link href="/create">
                      <Button className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Write Your First Shayari
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {filteredShayaris.map((shayari) => (
                    <ShayariCard
                      key={shayari._id}
                      shayari={shayari}
                      currentUser={user}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
