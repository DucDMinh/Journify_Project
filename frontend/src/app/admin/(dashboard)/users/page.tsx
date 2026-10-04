"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Users, RefreshCw, UserPlus } from "lucide-react";
import { toast } from 'sonner';
import { api } from "@/lib/apiClient";
import { matchesSearch as matchesText } from "@/lib/format";
import { User, UserRole } from "@/interface";
import { useAutoRefresh } from "@/hooks/admin/useAutoRefresh";
import UserFilters from "@/components/admin/users/UserFilters";
import UserTable from "@/components/admin/users/UserTable";
import UserFormModal from "@/components/modals/admin/UserFormModal";
import DeleteConfirmModal from "@/components/modals/admin/DeleteConfirmModal";

export default function UserManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const fetchUsers = useCallback(async () => {
        const { data, response } = await api.get<User[]>("/users");
        if (!response.ok) {
            toast.error(data.message || "Không thể tải danh sách người dùng");
        } else {
            setUsers((data.data ?? []).filter((u) => u && typeof u.id !== "undefined"));
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        let ignore = false;
        api.get<User[]>("/users").then(({ data, response }) => {
            if (ignore) return;
            if (!response.ok) toast.error(data.message || "Không thể tải danh sách người dùng");
            else setUsers((data.data ?? []).filter((u) => u && typeof u.id !== "undefined"));
            setLoading(false);
        });
        return () => {
            ignore = true;
        };
    }, []);

    useAutoRefresh(fetchUsers);
    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const matchesSearch = matchesText(searchQuery, user.name, user.email);
            const matchesRole = roleFilter === "all" || user.role === roleFilter;
            const matchesStatus = statusFilter === "all" || user.status === statusFilter;
            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, searchQuery, roleFilter, statusFilter]);

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredUsers.slice(start, start + itemsPerPage);
    }, [filteredUsers, currentPage, itemsPerPage]);
    const handleDelete = async () => {
        if (!userToDelete) return;
        setIsDeleting(true);
        const { response, data } = await api.delete(`/users/${userToDelete.id}`);
        setIsDeleting(false);
        setIsDeleteConfirmOpen(false);
        if (!response.ok) {
            toast.error(data.message || "Xóa người dùng thất bại");
            return;
        }
        setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
        toast.success(`Đã xóa người dùng "${userToDelete.name}"`);
    };

    const toggleStatus = async (user: User) => {
        const newStatus = user.status === "inactive" ? "active" : "inactive";
        const { response, data } = await api.patch(`/users/${user.id}`, { status: newStatus });
        if (!response.ok) {
            toast.error(data.message || "Cập nhật trạng thái thất bại");
            return;
        }
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)));
        toast.success(newStatus === "inactive" ? `Đã khóa tài khoản ${user.name}` : `Đã mở khóa tài khoản ${user.name}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-950 dark:to-gray-900 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white"><Users /> Quản lý người dùng</h1>
                    <div className="flex gap-2">
                        <button onClick={fetchUsers} className="rounded-xl bg-white p-2.5 shadow dark:bg-gray-800 dark:text-gray-200" title="Làm mới" aria-label="Làm mới"><RefreshCw className="h-5 w-5" /></button>
                        <button onClick={() => { setSelectedUser(null); setIsModalOpen(true); }} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl flex items-center gap-2">
                            <UserPlus className="w-4 h-4" /> Thêm mới
                        </button>
                    </div>
                </div>
                <UserFilters
                    searchQuery={searchQuery} setSearchQuery={(val) => { setSearchQuery(val); setCurrentPage(1); }}
                    roleFilter={roleFilter} setRoleFilter={(val) => { setRoleFilter(val); setCurrentPage(1); }}
                    statusFilter={statusFilter} setStatusFilter={(val) => { setStatusFilter(val); setCurrentPage(1); }}
                />
                <UserTable
                    users={paginatedUsers}
                    loading={loading}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalFiltered={filteredUsers.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onEdit={(user) => { setSelectedUser(user); setIsModalOpen(true); }}
                    onDelete={(user) => { setUserToDelete(user); setIsDeleteConfirmOpen(true); }}
                    onToggleStatus={toggleStatus}
                />
                <UserFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    selectedUser={selectedUser}
                    onSuccess={fetchUsers}
                />

                <DeleteConfirmModal
                    isOpen={isDeleteConfirmOpen}
                    onClose={() => setIsDeleteConfirmOpen(false)}
                    userToDelete={userToDelete}
                    onConfirm={handleDelete}
                    isDeleting={isDeleting}
                />
            </div>
        </div>
    );
}