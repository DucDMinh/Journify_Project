import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Loader2 } from "lucide-react";
import { User } from "@/interface";

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    userToDelete: User | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

export default function DeleteConfirmModal({ isOpen, onClose, userToDelete, onConfirm, isDeleting }: DeleteConfirmModalProps) {
    if (!isOpen || !userToDelete) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
                    <div className="w-14 h-14 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <Trash2 className="h-7 w-7 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Xác nhận xóa</h3>
                    <p className="text-sm text-gray-500 mb-6">Bạn có chắc muốn xóa người dùng <span className="font-semibold text-gray-900">{userToDelete.name}</span>?</p>
                    <div className="flex justify-center gap-3">
                        <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium hover:bg-gray-100 rounded-xl">Hủy</button>
                        <button onClick={onConfirm} disabled={isDeleting} className="px-5 py-2.5 bg-red-600 text-white font-medium rounded-xl flex items-center gap-2">
                            {isDeleting ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang xóa...</> : "Xóa vĩnh viễn"}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}