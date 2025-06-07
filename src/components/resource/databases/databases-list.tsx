"use client"

import {useState} from "react"
import {Table, TableBody, TableCell, TableHead, TableHeader, TablePage, TableRow} from "@/components/ui/table"
import {useDBCount, useDBList} from "@/hooks/use-resource.tsx";

interface DatabasesListProps {
    searchQuery: string
    onSelectDatabase: (id: number) => void
    selectedDbId: number | null
}

export function DatabasesList({searchQuery, onSelectDatabase, selectedDbId}: DatabasesListProps) {
    const [recentOffset, setRecentOffset] = useState<number>(0)

    // 根据是否有搜索查询来获取数据
    const shouldFetchList = !searchQuery; // 没有搜索查询时才获取列表
    const {data: recentDatabases = []} = useDBList(recentOffset, shouldFetchList);
    const databases = searchQuery ? [] : recentDatabases; // TODO: 搜索时使用搜索API
    const {data: dbCounts = 0} = useDBCount();

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">数据库列表</h2>

            {databases.length > 0 ? (
                <div className="rounded-md border pb-3">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>名称</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {databases.map((db) => (
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
                    <TablePage
                        totalItems={dbCounts}
                        offset={recentOffset}
                        pageSize={8}
                        setOffset={setRecentOffset}
                    />
                </div>
            ) : (
                <div className="py-12 text-center text-muted-foreground">未找到匹配的数据库</div>
            )}
        </div>
    )
}
