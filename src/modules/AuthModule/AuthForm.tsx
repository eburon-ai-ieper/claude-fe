import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import * as z from "zod";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { useMutation } from "@tanstack/react-query";
import { login } from "./api";
import { useNavigate } from "react-router";
import type { AxiosError } from "axios";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/stores/authStore";

const formSchema = z.object({
  email: z.email(),
  password: z
    .string()
    .min(4, "Password must be at least 4 characters.")
    .max(100, "Password must be at most 100 characters."),
});

const AuthForm = () => {
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      const token = data.data.accessToken;
      const user = data.data.user; // full user object {id, email, role, name?}

      // Store token + full user in AuthStore
      useAuthStore.getState().setAuth(token, user);

      // Redirect based on role
      switch (user.role) {
        case "SUPER_ADMIN":
          return navigate("/super-admin");
        case "ORGANIZATION_OWNER":
          return navigate("/organization-owner");
        case "ADMIN":
          return navigate("/admin");
        case "TEACHER":
          return navigate("/teacher");
        case "STUDENT":
          return navigate("/student");
        default:
          return navigate("/403");
      }
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error?.response?.data.message || error.message);
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    mutation.mutate(data);
  }
  return (
    <div className="my-12 w-200 flex justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} id="login-form">
            <FieldGroup className="flex flex-col gap-6">
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      {...field}
                      id="email"
                      aria-invalid={fieldState.invalid}
                      placeholder="admin@gmail.com"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input
                      {...field}
                      id="password"
                      type="password"
                      aria-invalid={fieldState.invalid}
                      placeholder="1111"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              form.setValue("email", "admin@test.com");
              form.setValue("password", "superadmin");
            }}
          >
            Super Admin Demo
          </Button>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              form.setValue("email", "teacher@gmail.com");
              form.setValue("password", "1111");
            }}
          >
            Teacher Demo
          </Button>

          {/* original login button */}
          <Button
            disabled={mutation.isPending}
            type="submit"
            className="w-full flex items-center"
            form="login-form"
          >
            <p>Login</p>
            {mutation.isPending && <Spinner />}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AuthForm;
