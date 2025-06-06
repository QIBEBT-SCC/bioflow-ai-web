"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"

// Mock data for demonstration
const MOCK_DATABASES = [
    { id: 1, name: "人类基因组参考数据库", description: "GRCh38/hg38 人类基因组参考序列" },
    { id: 2, name: "小鼠基因组参考数据库", description: "GRCm39/mm39 小鼠基因组参考序列" },
    { id: 3, name: "UniProt 蛋白质数据库", description: "蛋白质序列和功能信息的综合数据库" },
    { id: 4, name: "KEGG 通路数据库", description: "基因和基因组信息的百科全书" },
    { id: 5, name: "GO 基因本体论数据库", description: "基因产物属性的综合表示" },
    { id: 6, name: "RefSeq 数据库", description: "综合性、带注释的序列数据库" },
    { id: 7, name: "dbSNP 数据库", description: "单核苷酸多态性数据库" },
    { id: 8, name: "COSMIC 数据库", description: "体细胞突变目录" },
]

interface DatabasesListProps {
    searchQuery: string
    onSelectDatabase: (id: number) => void
    selectedDbId: number | null
}

export function DatabasesList({ searchQuery, onSelectDatabase, selectedDbId }: DatabasesListProps) {
    const [page, setPage] = useState(1)
    const [filteredDatabases, setFilteredDatabases] = useState(MOCK_DATABASES)

    const itemsPerPage = 5
    const totalPages = Math.ceil(filteredDatabases.length / itemsPerPage)

    useEffect(() => {
        if (searchQuery) {
            setFilteredDatabases(
                MOCK_DATABASES.filter(
                    (db) =>
                        db.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (db.description && db.description.toLowerCase().includes(searchQuery.toLowerCase())),
                ),
            )
            setPage(1)
        } else {
            setFilteredDatabases(MOCK_DATABASES)
        }
    }, [searchQuery])

    const paginatedDatabases = filteredDatabases.slice((page - 1) * itemsPerPage, page * itemsPerPage)

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">数据库列表</h2>

            {filteredDatabases.length > 0 ? (
                <>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>名称</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedDatabases.map((db) => (
                                    <TableRow
                                        key={db.id}
                                        className={selectedDbId === db.id ? "bg-muted" : ""}
                                        onClick={() => onSelectDatabase(db.id)}
                                    >
                                        <TableCell className="font-medium">{db.name}</TableCell>
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
                <div className="py-12 text-center text-muted-foreground">未找到匹配的数据库</div>
            )}
        </div>
    )
}
