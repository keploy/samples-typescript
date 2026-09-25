"use client"

import useSWR from "swr"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Eye, TestTube, Activity } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Test {
  id: string
  route: string
  method: string
  status: "passed" | "failed" | "pending" | "running"
}

function getStatusVariant(status: string) {
  switch (status.toLowerCase()) {
    case "passed":
      return "default"
    case "failed":
      return "destructive"
    case "pending":
      return "secondary"
    case "running":
      return "outline"
    default:
      return "secondary"
  }
}

function getMethodColor(method: string) {
  switch (method.toUpperCase()) {
    case "GET":
      return "bg-green-100 text-green-800 border-green-200"
    case "POST":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "PUT":
      return "bg-orange-100 text-orange-800 border-orange-200"
    case "DELETE":
      return "bg-red-100 text-red-800 border-red-200"
    case "PATCH":
      return "bg-purple-100 text-purple-800 border-purple-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Skeleton className="h-6 w-6" />
        <Skeleton className="h-8 w-48" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ErrorState() {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="flex items-center space-x-3 pt-6">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <div>
          <h3 className="font-semibold text-red-800">Error loading tests</h3>
          <p className="text-sm text-red-600">
            Failed to fetch test data. Please try again.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Home() {
  const { data, error, isLoading } = useSWR<Test[]>(`${process.env.NEXT_PUBLIC_API_BASE_URL}/tests`, fetcher)

  const getCount = (status: string) =>
    data?.filter((test) => test.status === status).length || 0

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
        <div className="mx-auto max-w-6xl">
          <ErrorState />
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
        <div className="mx-auto max-w-6xl">
          <LoadingSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header + CTA */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
              <TestTube className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Keploy Tests
              </h1>
              <p className="text-slate-600">
                Monitor and manage your API test suite
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="/tests/new">Create Test</Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center space-x-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Total Tests
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {data?.length || 0}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center space-x-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <div className="h-3 w-3 rounded-full bg-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Passed</p>
                <p className="text-2xl font-bold text-green-600">
                  {getCount("passed")}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center space-x-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <div className="h-3 w-3 rounded-full bg-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {getCount("failed")}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center space-x-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                <div className="h-3 w-3 rounded-full bg-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {getCount("pending")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TestTube className="h-5 w-5" />
              <span>Test Results</span>
            </CardTitle>
            <CardDescription>
              View detailed results for all your API tests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data && data.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">ID</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead className="w-24">Method</TableHead>
                      <TableHead className="w-24">Status</TableHead>
                      <TableHead className="w-20 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((test) => (
                      <TableRow key={test.id} className="hover:bg-slate-50">
                        <TableCell className="font-mono text-sm font-medium">
                          {test.id}
                        </TableCell>
                        <TableCell>
                          <code className="rounded bg-slate-100 px-2 py-1 text-sm font-mono">
                            {test.route}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`font-mono text-xs ${getMethodColor(
                              test.method
                            )}`}
                          >
                            {test.method.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(test.status)}>
                            {test.status.charAt(0).toUpperCase() +
                              test.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/tests/${test.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <TestTube className="h-12 w-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No tests found
                </h3>
                <p className="text-slate-600 mb-4">
                  Get started by creating your first test
                </p>
                <Button asChild>
                  <Link href="/tests/new">Create Test</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
