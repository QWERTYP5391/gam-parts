"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { registerUser } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(1, "Phone is required"),
  role: z.enum(["vehicle_owner", "mechanic", "dealer"]),
  townId: z.number().int().positive("Please select a town"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface Town {
  id: number;
  name: string;
  region: string;
}

export function RegisterForm({ towns }: { towns: Town[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "vehicle_owner",
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    setServerError(null);
    startTransition(async () => {
      const result = await registerUser(data);
      if (result.success) {
        router.push("/login?registered=true");
      } else {
        setServerError(result.error);
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      data-testid="register-form"
    >
      {serverError && (
        <div
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
          data-testid="register-error"
        >
          {serverError}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          {...register("name")}
          data-testid="register-name"
          placeholder="Your full name"
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          data-testid="register-email"
          placeholder="you@example.com"
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          {...register("password")}
          data-testid="register-password"
          placeholder="At least 8 characters"
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          {...register("phone")}
          data-testid="register-phone"
          placeholder="+220 ..."
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">I am a...</Label>
        <Select id="role" {...register("role")} data-testid="register-role">
          <option value="vehicle_owner">Vehicle Owner</option>
          <option value="mechanic">Mechanic</option>
          <option value="dealer">Spare Parts Dealer</option>
        </Select>
        {errors.role && (
          <p className="text-sm text-destructive">{errors.role.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="townId">Location</Label>
        <Select
          id="townId"
          data-testid="register-town"
          onChange={(e) => setValue("townId", Number(e.target.value))}
          defaultValue=""
        >
          <option value="" disabled>
            Select your town
          </option>
          {towns.map((town) => (
            <option key={town.id} value={town.id}>
              {town.name} ({town.region})
            </option>
          ))}
        </Select>
        {errors.townId && (
          <p className="text-sm text-destructive">{errors.townId.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isPending}
        data-testid="register-submit"
      >
        {isPending ? "Creating account..." : "Create Account"}
      </Button>
    </form>
  );
}
