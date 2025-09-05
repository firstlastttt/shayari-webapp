"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Heart, MoreVertical, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ReportDialog } from "./report-dialog"

export default function ShayariCard({ shayari, currentUser, onEdit, onDelete, onLike, isLiked: initialIsLiked }) {
  const [liked, setLiked] = useState(initialIsLiked || false)
  const [likesCount, setLikesCount] = useState(shayari.likesCount || 0)
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const isOwner = currentUser && currentUser._id === shayari.authorId

  useEffect(() => {
    if (currentUser && !initialized) {
      fetchLikeStatus()
      setInitialized(true)
    }
  }, [currentUser, shayari._id, initialized])

  const fetchLikeStatus = async () => {
    try {
      const response = await fetch(`/api/shayaris/${shayari._id}/like`)
      if (response.ok) {
        const data = await response.json()
        setLiked(data.liked)
        setLikesCount(data.likesCount)
      }
    } catch (error) {
      console.error("Failed to fetch like status:", error)
    }
  }

  const handleLike = async () => {
    if (!currentUser || loading) return

    setLoading(true)
    try {
      const response = await fetch(`/api/shayaris/${shayari._id}/like`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        setLiked(data.liked)
        setLikesCount(data.likesCount)
        if (onLike) onLike(shayari._id, data.liked)
      }
    } catch (error) {
      console.error("Failed to like shayari:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full hover:shadow-lg transition-all duration-200 dark:hover:shadow-purple-500/10 border-0 shadow-sm dark:bg-gray-900/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-purple-100 dark:ring-purple-800">
              <AvatarImage src={shayari.author?.profilePhoto || "/placeholder.svg"} alt={shayari.author?.username} />
              <AvatarFallback className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 text-purple-700 dark:text-purple-300 font-semibold">
                {shayari.author?.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm dark:text-white">{shayari.author?.username}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(shayari.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={shayari.visibility === "public" ? "default" : "secondary"} className="text-xs">
              {shayari.visibility === "public" ? (
                <>
                  <Eye className="w-3 h-3 mr-1" />
                  Public
                </>
              ) : (
                <>
                  <EyeOff className="w-3 h-3 mr-1" />
                  Private
                </>
              )}
            </Badge>

            {!isOwner && currentUser && <ReportDialog shayariId={shayari._id} />}

            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit && onEdit(shayari)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete && onDelete(shayari._id)} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white text-balance">{shayari.title}</h3>
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 p-4 rounded-lg border-l-4 border-purple-400 dark:border-purple-500">
            <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line font-medium text-pretty">
              {shayari.content}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={!currentUser || loading}
              className={`flex items-center gap-2 transition-all duration-200 hover:scale-105 ${
                liked
                  ? "text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  : "text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
              }`}
            >
              <Heart className={`h-4 w-4 transition-all duration-200 ${liked ? "fill-current scale-110" : ""}`} />
              <span className="font-medium">{likesCount}</span>
            </Button>

            <div className="text-xs text-muted-foreground">{shayari.updatedAt !== shayari.createdAt && "Edited"}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
