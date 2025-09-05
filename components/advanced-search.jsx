"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Filter, Search, X } from "lucide-react"
import { format } from "date-fns"

export default function AdvancedSearch({ onSearch, currentFilters = {} }) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState({
    query: currentFilters.query || "",
    author: currentFilters.author || "",
    dateFrom: currentFilters.dateFrom ? new Date(currentFilters.dateFrom) : null,
    dateTo: currentFilters.dateTo ? new Date(currentFilters.dateTo) : null,
    sortBy: currentFilters.sortBy || "relevance",
  })

  const handleSearch = () => {
    const searchParams = {
      ...filters,
      dateFrom: filters.dateFrom ? format(filters.dateFrom, "yyyy-MM-dd") : null,
      dateTo: filters.dateTo ? format(filters.dateTo, "yyyy-MM-dd") : null,
    }

    // Remove null/empty values
    Object.keys(searchParams).forEach((key) => {
      if (!searchParams[key]) {
        delete searchParams[key]
      }
    })

    onSearch(searchParams)
    setIsOpen(false)
  }

  const handleReset = () => {
    setFilters({
      query: "",
      author: "",
      dateFrom: null,
      dateTo: null,
      sortBy: "relevance",
    })
  }

  const hasActiveFilters =
    filters.query || filters.author || filters.dateFrom || filters.dateTo || filters.sortBy !== "relevance"

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="relative bg-transparent">
          <Filter className="w-4 h-4 mr-2" />
          Advanced Search
          {hasActiveFilters && <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-600 rounded-full" />}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Advanced Search</DialogTitle>
          <DialogDescription>Use advanced filters to find exactly what you're looking for</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search-query">Search Text</Label>
            <Input
              id="search-query"
              placeholder="Search in titles and content..."
              value={filters.query}
              onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="author-filter">Author</Label>
            <Input
              id="author-filter"
              placeholder="Search by author username..."
              value={filters.author}
              onChange={(e) => setFilters((prev) => ({ ...prev, author: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateFrom ? format(filters.dateFrom, "MMM dd, yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) => setFilters((prev) => ({ ...prev, dateFrom: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateTo ? format(filters.dateTo, "MMM dd, yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) => setFilters((prev) => ({ ...prev, dateTo: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sort By</Label>
            <Select
              value={filters.sortBy}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, sortBy: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSearch} className="flex-1 bg-purple-600 hover:bg-purple-700">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
            <Button onClick={handleReset} variant="outline">
              <X className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
