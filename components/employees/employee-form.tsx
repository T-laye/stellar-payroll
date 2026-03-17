"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EmployeeSchema, type EmployeeFormData } from "@/lib/schemas";
import { useEmployeeStore, type Employee } from "@/lib/stores/employee-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { countries, currencies } from "../../lib/utils/constants";

interface EmployeeFormProps {
  employee?: Employee;
  onSuccess?: () => void;
}
export function EmployeeForm({ employee, onSuccess }: EmployeeFormProps) {
  const addEmployee = useEmployeeStore((state) => state.addEmployee);
  const updateEmployee = useEmployeeStore((state) => state.updateEmployee);
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(EmployeeSchema),
    defaultValues: employee || {
      status: "active",
      paymentMethod: "stellar_wallet",
      currency: "USD",
    },
  });

  const paymentMethod = watch("paymentMethod");
  const selectedCountry = watch("country");

  const filteredCountries = countries.filter((c) =>
    c.toLowerCase().includes(countrySearch.toLowerCase()),
  );

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      if (employee) {
        updateEmployee(employee.id, data);
        toast.success("Employee updated successfully!");
      } else {
        addEmployee(data);
        toast.success("Employee added successfully!");
      }
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to save employee");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Full Name
          </label>
          <Input
            {...register("name")}
            placeholder="John Doe"
            className="bg-input border border-border"
          />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Email</label>
          <Input
            {...register("email")}
            type="email"
            placeholder="john@example.com"
            className="bg-input border border-border"
          />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Country Combobox */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Country</label>
          <Popover open={countryOpen} onOpenChange={setCountryOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={countryOpen}
                className="w-full justify-between bg-input border border-border font-normal hover:bg-input"
              >
                <span
                  className={cn(!selectedCountry && "text-muted-foreground")}
                >
                  {selectedCountry || "Select country..."}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Search country..."
                  value={countrySearch}
                  onValueChange={setCountrySearch}
                />
                <CommandList>
                  <CommandEmpty>No country found.</CommandEmpty>
                  <CommandGroup>
                    {filteredCountries.map((country) => (
                      <CommandItem
                        key={country}
                        value={country}
                        onSelect={(val) => {
                          setValue("country", val);
                          setCountryOpen(false);
                          setCountrySearch("");
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCountry === country
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        {country}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {errors.country && (
            <p className="text-xs text-red-500">{errors.country.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Currency
          </label>
          <Select
            defaultValue={employee?.currency || "USD"}
            onValueChange={(value) => setValue("currency", value)}
          >
            <SelectTrigger className="bg-input border border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.value} value={currency.value}>
                  {currency.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.currency && (
            <p className="text-xs text-red-500">{errors.currency.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Salary</label>
          <Input
            {...register("salary", { valueAsNumber: true })}
            type="number"
            placeholder="5000"
            className="bg-input border border-border"
          />
          {errors.salary && (
            <p className="text-xs text-red-500">{errors.salary.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Join Date
          </label>
          <Input
            {...register("joinDate")}
            type="date"
            className="bg-input border border-border"
          />
          {errors.joinDate && (
            <p className="text-xs text-red-500">{errors.joinDate.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Payment Method
        </label>
        <Select
          defaultValue={paymentMethod || "stellar_wallet"}
          onValueChange={(value) => setValue("paymentMethod", value as any)}
        >
          <SelectTrigger className="bg-input border border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stellar_wallet">Stellar Wallet</SelectItem>
            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {paymentMethod === "stellar_wallet" && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Stellar Wallet Address
          </label>
          <Input
            {...register("walletAddress")}
            placeholder="G..."
            className="bg-input border border-border font-mono text-sm"
          />
          {errors.walletAddress && (
            <p className="text-xs text-red-500">
              {errors.walletAddress.message}
            </p>
          )}
        </div>
      )}

      {paymentMethod === "bank_transfer" && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Bank Account
          </label>
          <Input
            {...register("bankAccount")}
            placeholder="IBAN or Account Number"
            className="bg-input border border-border"
          />
          {errors.bankAccount && (
            <p className="text-xs text-red-500">{errors.bankAccount.message}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Status</label>
        <Select
          defaultValue={employee?.status || "active"}
          onValueChange={(value) => setValue("status", value as any)}
        >
          <SelectTrigger className="bg-input border border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3 justify-end pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary hover:bg-primary/90"
        >
          {isSubmitting ? "Saving..." : "Save Employee"}
        </Button>
      </div>
    </form>
  );
}
