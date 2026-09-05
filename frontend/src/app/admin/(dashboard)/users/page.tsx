/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Users, RefreshCw, UserPlus } from "lucide-react";
import { toast } from 'sonner';
import { api } from "@/lib/apiClient";
import { User, UserRole } from "@/interface";
import { supabase } from "@/utils/supabaseClient";
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
        setLoading(true);
        try {
            const { data } = await api.get(`/users?_t=${Date.now()}`);
            const rawUsers = data?.data?.data || data?.data || data || [];
            setUsers(rawUsers.filter((u: any) => u && typeof u.id !== "undefined"));
        } catch (error) {
            toast.error("Không thể tải danh sách người dùng");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setTimeout(() => {
            fetchUsers();
        }, 0);
        const userChannel = supabase
            .channel(`custom-user-channel-${Date.now()}`)
            .on("postgres_changes", { event: "*", schema: "public", table: "users" }, fetchUsers)
            .subscribe();
        return () => { supabase.removeChannel(userChannel); };
    }, [fetchUsers]);
    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const matchesSearch = user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || user.email?.toLowerCase().includes(searchQuery.toLowerCase());
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
        try {
            await api.delete(`/users/${userToDelete.id}`);
            setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
            toast.success("Xóa thành công!");
        } catch (error) {
            toast.error("Xóa thất bại");
        } finally {
            setIsDeleting(false);
            setIsDeleteConfirmOpen(false);
        }
    };

    const toggleStatus = async (user: User) => {
        const newStatus = user.status === "active" ? "inactive" : "active";
        try {
            await api.patch(`/users/${user.id}`, { status: newStatus });
            setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)));
            toast.success("Cập nhật trạng thái thành công");
        } catch (error) {
            toast.error("Cập nhật trạng thái thất bại");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-950 dark:to-gray-900 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold flex items-center gap-2"><Users /> Quản lý người dùng</h1>
                    <div className="flex gap-2">
                        <button onClick={fetchUsers} className="p-2.5 bg-white rounded-xl shadow"><RefreshCw className="w-5 h-5" /></button>
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