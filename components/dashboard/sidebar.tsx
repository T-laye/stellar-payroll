"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Briefcase, Send, BarChart3, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: BarChart3,
  },
  {
    label: "Employees",
    href: "/dashboard/employees",
    icon: Users,
  },
  {
    label: "Payroll Groups",
    href: "/dashboard/payroll",
    icon: Briefcase,
  },
  {
    label: "Payments",
    href: "/dashboard/payments",
    icon: Send,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

interface DashboardSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function DashboardSidebar({
  isOpen = true,
  onClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r bg-sidebar transition-transform duration-200 ease-in-out md:relative md:top-0 md:translate-x-0 z-40",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <nav className="flex flex-col gap-2 p-4 sm:p-6">
          {/* Close button for mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="md:hidden self-end mb-2"
          >
            <X className="h-5 w-5" />
          </Button>

          {navItems.map((item) => {
            const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
