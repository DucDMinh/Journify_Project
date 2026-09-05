import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2, CheckCircle, AlertTriangle, UserX, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { User, UserRole } from "@/interface";

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bg: string }> = {
    ADMIN: { label: "Quản trị viên", color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-100 dark:bg-purple-900/30" },
    USER: { label: "Người dùng", color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-100 dark:bg-blue-900/30" },
};

interface UserTableProps {
    users: User[];
    loading: boolean;
    currentPage: number;
    totalPages: number;
    totalFiltered: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
    onToggleStatus: (user: User) => void;
}

export default function UserTable({
    users, loading, currentPage, totalPages, totalFiltered, itemsPerPage, onPageChange, onEdit, onDelete, onToggleStatus
}: UserTableProps) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 bg-white dark:bg-gray-800/60 rounded-2xl shadow-lg border border-gray-200/60 dark:border-gray-700/50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-500">Đang tải dữ liệu...</span>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-gray-800/60 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/60 dark:border-gray-700/50 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 uppercase text-xs font-semibold tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Người dùng</th>
                            <th className="px-6 py-4 hidden md:table-cell">Email</th>
                            <th className="px-6 py-4">Vai trò</th>
                            <th className="px-6 py-4 hidden sm:table-cell">Trạng thái</th>
                            <th className="px-6 py-4 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                        <AnimatePresence mode="popLayout">
                            {users.length > 0 ? (
                                users.map((user) => (
                                    <motion.tr key={user.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                                    {user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                                                    <p className="text-xs text-gray-500 md:hidden">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell text-gray-600 dark:text-gray-300">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_CONFIG[user.role]?.bg} ${ROLE_CONFIG[user.role]?.color}`}>
                                                {ROLE_CONFIG[user.role]?.label || user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 hidden sm:table-cell">
                                            <button onClick={() => onToggleStatus(user)} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-all ${user.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"}`}>
                                                {user.status === "active" ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                                                {user.status === "active" ? "Hoạt động" : "Vô hiệu"}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => onEdit(user)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-blue-600 transition-colors" title="Chỉnh sửa"><Pencil className="h-4 w-4" /></button>
                                                <button onClick={() => onDelete(user)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-500 hover:text-red-600 transition-colors" title="Xóa"><Trash2 className="h-4 w-4" /></button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3 text-gray-400">
                                            <UserX className="h-10 w-10" />
                                            <p className="text-base font-medium">Không tìm thấy người dùng</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-700/50">
                    <p className="text-xs text-gray-500">
                        Hiển thị {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalFiltered)} trên tổng {totalFiltered} người dùng
                    </p>
                    <div className="flex items-center gap-2">
                        <button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-all"><ChevronLeft className="h-4 w-4" /></button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button key={page} onClick={() => onPageChange(page)} className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${currentPage === page ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>
                                {page}
                            </button>
                        ))}
                        <button onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-all"><ChevronRight className="h-4 w-4" /></button>
                    </div>
                </div>
            )}
        </motion.div>
    );
}