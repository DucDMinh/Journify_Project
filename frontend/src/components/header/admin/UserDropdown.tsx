"use client";
import React, { useState } from "react";
import { ChevronDown, ExternalLink, LogOut, Users } from "lucide-react";
import { Dropdown } from "../../ui/dropdown/Dropdown";
import { DropdownItem } from "../../ui/dropdown/DropdownItem";
import { useAuth } from "@/hooks/auth/AuthContext";
import UserAvatar from "@/components/common/UserAvatar";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const itemClass =
  "flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  function toggleDropdown(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <button onClick={toggleDropdown} className="flex items-center text-gray-700 dark:text-gray-400 dropdown-toggle" aria-label="Mở menu tài khoản">
        <span className="mr-3">
          <UserAvatar src={user?.avatar} name={user?.name} className="h-11 w-11" textClassName="text-base" toneClassName="bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400" />
        </span>
        <span className="mr-1 hidden max-w-[160px] truncate font-medium text-theme-sm sm:block">{user?.name}</span>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 dark:text-gray-400 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div>
          <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">{user?.name}</span>
          <span className="mt-0.5 block truncate text-theme-xs text-gray-500 dark:text-gray-400">{user?.email}</span>
          <span className="mt-2 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">Quản trị viên</span>
        </div>

        <ul className="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
          <li>
            <DropdownItem onItemClick={closeDropdown} tag="a" href="/users" className={itemClass}>
              <Users className="h-5 w-5 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300" />
              Quản lý người dùng
            </DropdownItem>
          </li>
          <li>
            <a href={APP_URL} target="_blank" rel="noreferrer" onClick={closeDropdown} className={itemClass}>
              <ExternalLink className="h-5 w-5 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300" />
              Mở trang người dùng
            </a>
          </li>
        </ul>
        <button
          type="button"
          onClick={() => {
            closeDropdown();
            logout();
            window.location.href = "/auth/signin";
          }}
          className={`${itemClass} mt-3 w-full`}
        >
          <LogOut className="h-5 w-5 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
          Đăng xuất
        </button>
      </Dropdown>
    </div>
  );
}
