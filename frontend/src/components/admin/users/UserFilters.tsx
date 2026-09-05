import { Search, Filter, Shield } from "lucide-react";
import { UserRole } from "@/interface";

interface UserFiltersProps {
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    roleFilter: UserRole | "all";
    setRoleFilter: (val: UserRole | "all") => void;
    statusFilter: "all" | "active" | "inactive";
    setStatusFilter: (val: "all" | "active" | "inactive") => void;
}

export default function UserFilters({
    searchQuery, setSearchQuery, roleFilter, setRoleFilter, statusFilter, setStatusFilter
}: UserFiltersProps) {
    return (
        <div className="bg-white dark:bg-gray-800/60 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/60 dark:border-gray-700/50 p-4 sm:p-6 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative col-span-1 sm:col-span-2 lg:col-span-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên hoặc email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                    />
                </div>

                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value as UserRole | "all")}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                    >
                        <option value="all">Tất cả vai trò</option>
                        <option value="ADMIN">Quản trị viên</option>
                        <option value="USER">Người dùng</option>
                    </select>
                </div>

                <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="active">Đang hoạt động</option>
                        <option value="inactive">Vô hiệu hóa</option>
                    </select>
                </div>
            </div>
        </div>
    );
}