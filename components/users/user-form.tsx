"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { userSchema, createUserSchema, UserInput, CreateUserInput } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { FieldGroup, Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { mutate } from "swr"

interface UserFormProps {
  user?: {
    id: string
    name: string
    email: string
    role: "ADMIN" | "STAFF"
    isActive: boolean
  }
  onSuccess?: () => void
}

export function UserForm({ user, onSuccess }: UserFormProps) {
  const isEditing = !!user

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UserInput | CreateUserInput>({
    resolver: zodResolver(isEditing ? userSchema : createUserSchema),
    defaultValues: user
      ? {
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        }
      : {
          name: "",
          email: "",
          password: "",
          role: "STAFF",
          isActive: true,
        },
  })

  const watchIsActive = watch("isActive")
  const watchRole = watch("role")

  async function onSubmit(data: UserInput | CreateUserInput) {
    try {
      const url = isEditing ? `/api/users/${user.id}` : "/api/users"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (result.success) {
        toast.success(
          isEditing ? "User updated successfully" : "User created successfully"
        )
        mutate("/api/users")
        onSuccess?.()
      } else {
        toast.error(result.error || "Failed to save user")
      }
    } catch {
      toast.error("Failed to save user")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Full Name</FieldLabel>
          <Input id="name" placeholder="John Doe" {...register("name")} />
          {errors.name && <FieldError>{errors.name.message}</FieldError>}
        </Field>

        <Field>
          <FieldLabel htmlFor="email">Email Address</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            {...register("email")}
          />
          {errors.email && <FieldError>{errors.email.message}</FieldError>}
        </Field>

        {!isEditing && (
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              placeholder="Min 6 characters"
              {...register("password")}
            />
            {errors.password && (
              <FieldError>{errors.password.message}</FieldError>
            )}
          </Field>
        )}

        <Field>
          <FieldLabel>Role</FieldLabel>
          <Select
            value={watchRole}
            onValueChange={(value) =>
              setValue("role", value as "ADMIN" | "STAFF")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="STAFF">Staff</SelectItem>
            </SelectContent>
          </Select>
          {errors.role && <FieldError>{errors.role.message}</FieldError>}
        </Field>

        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="isActive">Active Status</FieldLabel>
            <Switch
              id="isActive"
              checked={watchIsActive}
              onCheckedChange={(checked) => setValue("isActive", checked)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Inactive users cannot log in to the system
          </p>
        </Field>
      </FieldGroup>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Saving...
            </>
          ) : isEditing ? (
            "Update User"
          ) : (
            "Create User"
          )}
        </Button>
      </div>
    </form>
  )
}
