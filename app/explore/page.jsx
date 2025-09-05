"use client"

import { useState, useEffect, useCallback } from "react"
import Navbar from "@/components/navbar"
import ShayariCard from "@/components/shayari-card"
import SearchSuggestions from "@/components/search-suggestions"
import AdvancedSearch from "@/components/advanced-search"
import { InfiniteScrollTrigger } from "@/components/infinite-scroll"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Heart, TrendingUp, Clock, Star, X, Filter, Loader2 } from "lucide-react"

export default function ExplorePage() {
  const [user, setUser] = useState(null)
  const [shayaris, setShayaris] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [sortBy, setSortBy] = useState("trending")
  const [activeFilters, setActiveFilters] = useState({})
  const [suggestions, setSuggestions] = useState([])

  useEffect(() => {
    fetchUser()
    fetchShayaris(1, true)
  }, [])

  useEffect(() => {
    if (Object.keys(activeFilters).length > 0 || searchQuery) {
      performSearch(1, true)
    } else {
      fetchShayaris(1, true)
    }
  }, [activeFilters, sortBy])

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error("Failed to fetch user:", error)
    }
  }

  const fetchShayaris = async (pageNum = 1, reset = false) => {
    try {
      if (pageNum > 1) setLoadingMore(true)

      const url = `/api/shayaris?page=${pageNum}&limit=10`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()

        let sortedShayaris = data.shayaris
        if (sortBy === "recent") {
          sortedShayaris = data.shayaris.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        } else if (sortBy === "top") {
          sortedShayaris = data.shayaris.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))
        }

        if (reset) {
          setShayaris(sortedShayaris)
          setPage(1)
        } else {
          setShayaris((prev) => [...prev, ...sortedShayaris])
        }
        setHasMore(data.pagination.page < data.pagination.pages)
      }
    } catch (error) {
      console.error("Failed to fetch shayaris:", error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const performSearch = async (pageNum = 1, reset = false) => {
    try {
      if (pageNum === 1) setLoading(true)
      else setLoadingMore(true)

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "10",
        sortBy,
        ...activeFilters,
      })

      if (searchQuery) {
        params.set("q", searchQuery)
      }

      const response = await fetch(`/api/search?${params}`)
      if (response.ok) {
        const data = await response.json()

        if (reset) {
          setShayaris(data.shayaris)
          setSuggestions(data.suggestions || [])
          setPage(1)
        } else {
          setShayaris((prev) => [...prev, ...data.shayaris])
        }
        setHasMore(data.pagination.page < data.pagination.pages)
      }
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return

    const nextPage = page + 1
    setPage(nextPage)

    if (Object.keys(activeFilters).length > 0 || searchQuery) {
      performSearch(nextPage)
    } else {
      fetchShayaris(nextPage)
    }
  }, [page, loadingMore, hasMore, activeFilters, searchQuery])

  const handleSearchSelect = (selection) => {
    if (selection.type === "author") {
      setActiveFilters((prev) => ({ ...prev, author: selection.value }))
      setSearchQuery("")
    } else {
      setSearchQuery(selection.value)
      setActiveFilters((prev) => ({ ...prev, q: selection.value }))
    }
    setPage(1)
  }

  const handleAdvancedSearch = (filters) => {
    setActiveFilters(filters)
    setSearchQuery(filters.query || "")
    setSortBy(filters.sortBy || "relevance")
    setPage(1)
  }

  const removeFilter = (filterKey) => {
    const newFilters = { ...activeFilters }
    delete newFilters[filterKey]
    setActiveFilters(newFilters)

    if (filterKey === "q" || filterKey === "query") {
      setSearchQuery("")
    }
    setPage(1)
  }

  const clearAllFilters = () => {
    setActiveFilters({})
    setSearchQuery("")
    setSortBy("trending")
    setPage(1)
  }

  const handleLike = (shayariId, liked) => {
    setShayaris((prev) =>
      prev.map((shayari) =>
        shayari._id === shayariId
          ? {
              ...shayari,
              likesCount: liked ? (shayari.likesCount || 0) + 1 : Math.max(0, (shayari.likesCount || 0) - 1),
            }
          : shayari,
      ),
    )
  }

  const handleSortChange = (newSort) => {
    setSortBy(newSort)
    setPage(1)
    setShayaris([])
    setLoading(true)
  }

  if (loading && shayaris.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <div className="grid gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-3/4 mb-3" />
                    <Skeleton className="h-24 w-full mb-4" />
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const hasActiveFilters = Object.keys(activeFilters).length > 0 || searchQuery

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20 transition-colors duration-300">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
              <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 dark:text-red-400" />
              Explore Shayaris
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm sm:text-base">
              Discover beautiful poetry from our community of writers
            </p>

            {/* Search and Filters */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <SearchSuggestions
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onSelect={handleSearchSelect}
                  placeholder="Search shayaris, authors..."
                  className="flex-1"
                />
                <AdvancedSearch onSearch={handleAdvancedSearch} currentFilters={activeFilters} />
              </div>

              {/* Active Filters */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active filters:</span>

                  {(activeFilters.q || searchQuery) && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Search: "{activeFilters.q || searchQuery}"
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("q")} />
                    </Badge>
                  )}

                  {activeFilters.author && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Author: {activeFilters.author}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("author")} />
                    </Badge>
                  )}

                  {activeFilters.dateFrom && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      From: {activeFilters.dateFrom}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("dateFrom")} />
                    </Badge>
                  )}

                  {activeFilters.dateTo && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      To: {activeFilters.dateTo}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("dateTo")} />
                    </Badge>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Clear all
                  </Button>
                </div>
              )}

              {/* Search Suggestions */}
              {suggestions.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">Did you mean:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSearchSelect({ type: "query", value: suggestion })}
                        className="text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sort Tabs */}
            <Tabs value={sortBy} onValueChange={handleSortChange} className="w-full mt-6">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 max-w-lg">
                <TabsTrigger value="trending" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Trending</span>
                  <span className="sm:hidden">Hot</span>
                </TabsTrigger>
                <TabsTrigger value="recent" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  Recent
                </TabsTrigger>
                <TabsTrigger value="popular" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Star className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Popular</span>
                  <span className="sm:hidden">Top</span>
                </TabsTrigger>
                <TabsTrigger value="relevance" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Relevance</span>
                  <span className="sm:hidden">Best</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {shayaris.length === 0 ? (
            <Card className="dark:bg-gray-900/50">
              <CardContent className="text-center py-12">
                <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                <CardTitle className="mb-2 dark:text-white">
                  {hasActiveFilters ? "No shayaris found" : "No shayaris available"}
                </CardTitle>
                <CardDescription>
                  {hasActiveFilters
                    ? "Try adjusting your search terms or filters"
                    : "Be the first to share your poetry with the community!"}
                </CardDescription>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-6">
                {shayaris.map((shayari, index) => (
                  <InfiniteScrollTrigger
                    key={shayari._id}
                    onLoadMore={loadMore}
                    hasMore={hasMore}
                    loading={loadingMore}
                  >
                    <ShayariCard
                      shayari={shayari}
                      currentUser={user}
                      onLike={handleLike}
                      ref={index === shayaris.length - 3 ? undefined : null}
                    />
                  </InfiniteScrollTrigger>
                ))}
              </div>

              {loadingMore && (
                <div className="flex justify-center items-center py-8">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading more shayaris...</span>
                  </div>
                </div>
              )}

              {!hasMore && shayaris.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">You've reached the end! ✨</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
