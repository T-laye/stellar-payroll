"use client";

import { useAuthStore } from "@/lib/stores/auth-store";
import { usePayrollStore } from "@/lib/stores/payroll-store";
import { useEmployeeStore } from "@/lib/stores/employee-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, Send, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "../../lib/utils";

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const user = useAuthStore((state) => state.user);
  const employees = useEmployeeStore((state) => state.employees);
  const payrollGroups = usePayrollStore((state) => state.getGroups());
  const payments = usePayrollStore((state) => state.payments);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const stats = [
    {
      label: "Total Employees",
      value: employees.length,
      icon: Users,
      color: "text-blue-600",
      href: "/dashboard/employees",
    },
    {
      label: "Payroll Groups",
      value: payrollGroups.length,
      icon: Briefcase,
      color: "text-purple-600",
      href: "/dashboard/payroll",
    },
    {
      label: "Pending Payments",
      value: payments.filter((p) => p.status === "pending").length,
      icon: Send,
      color: "text-orange-600",
      href: "/dashboard/payments",
    },
    {
      label: "Total Processed",
      value: payments.filter((p) => p.status === "completed").length,
      icon: TrendingUp,
      color: "text-green-600",
      href: "/dashboard/payments",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link href={stat.href} key={stat.label}>
              <Card className="p-4 sm:p-6 hover:border-primary/50 transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-foreground/60 mb-1 sm:mb-2">
                      {stat.label}
                    </p>
                    <p className="text-2xl sm:text-3xl font-bold text-foreground">
                      {stat.value}
                    </p>
                  </div>
                  <Icon
                    className={cn(
                      "h-6 w-6 sm:h-8 sm:w-8 shrink-0",
                      stat.color,
                    )}
                  />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent Payments */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">
            Recent Payments
          </h2>
          <Link href="/dashboard/payments">
            <Button variant="outline" size="sm" className="text-xs sm:text-sm">
              View All
            </Button>
          </Link>
        </div>

        {payments.length === 0 ? (
          <p className="text-foreground/60 text-center py-8 text-sm">
            No payments yet
          </p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-foreground/70">
                    Employee
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-foreground/70 hidden sm:table-cell">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-foreground/70">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-foreground/70 hidden md:table-cell">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.slice(0, 5).map((payment) => {
                  const employee = employees.find(
                    (e) => e.id === payment.employeeId,
                  );
                  return (
                    <tr key={payment.id} className="border-b">
                      <td className="py-3 px-4 text-foreground">
                        {employee?.name || "Unknown"}
                      </td>
                      <td className="py-3 px-4 text-foreground hidden sm:table-cell">
                        {payment.amount} {payment.currency}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap",
                            payment.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : payment.status === "processing"
                                ? "bg-blue-100 text-blue-800"
                                : payment.status === "failed"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800",
                          )}
                        >
                          {payment.status.charAt(0).toUpperCase() +
                            payment.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-foreground/60 hidden md:table-cell text-xs">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
