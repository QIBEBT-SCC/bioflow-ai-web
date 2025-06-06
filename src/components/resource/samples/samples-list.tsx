"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx"
import { Badge } from "@/components/ui/badge.tsx"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination.tsx"

// Mock data for demonstration
const MOCK_SAMPLES = Array.from({ length: 20 }).map((_, i) => ({
    uid: `sample-${i + 1}`,
    sample_name: `样本 ${i + 1}`,
    project_name: `项目 ${Math.floor(i / 3) + 1}`,
    create_time: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
    file_count: Math.floor(Math.random() * 5) + 1,
}))

interface SamplesListProps {
    searchQuery: string
    onSelectSample: (id: string) => void
    selectedSampleId: string | null
}

export function SamplesList({ searchQuery, onSelectSample, selectedSampleId }: SamplesListProps) {
    const [page, setPage] = useState(1)
    const [filteredSamples, setFilteredSamples] = useState(MOCK_SAMPLES)

    const itemsPerPage = 5
    const totalPages = Math.ceil(filteredSamples.length / itemsPerPage)

    useEffect(() => {
        if (searchQuery) {
            setFilteredSamples(
                MOCK_SAMPLES.filter(
                    (sample) =>
                        sample.sample_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        sample.project_name.toLowerCase().includes(searchQuery.toLowerCase()),
                ),
            )
            setPage(1)
        } else {
            setFilteredSamples(MOCK_SAMPLES)
        }
    }, [searchQuery])

    const paginatedSamples = filteredSamples.slice((page - 1) * itemsPerPage, page * itemsPerPage)

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">样本列表</h2>

            {filteredSamples.length > 0 ? (
                <>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>样本名称</TableHead>
                                    <TableHead>项目</TableHead>
                                    <TableHead>文件</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedSamples.map((sample) => (
                                    <TableRow
                                        key={sample.uid}
                                        className={selectedSampleId === sample.uid ? "bg-muted" : ""}
                                        onClick={() => onSelectSample(sample.uid)}
                                    >
                                        <TableCell className="font-medium">{sample.sample_name}</TableCell>
                                        <TableCell>{sample.project_name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{sample.file_count}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <PaginationItem key={i}>
                                    <PaginationLink onClick={() => setPage(i + 1)} isActive={page === i + 1}>
                                        {i + 1}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </>
            ) : (
                <div className="py-12 text-center text-muted-foreground">未找到匹配的样本</div>
            )}
        </div>
    )
}
