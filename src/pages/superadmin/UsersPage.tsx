import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAdmin,
  createOrganizationOwner,
  fetchAdmins,
  fetchOrganizations,
  updateAdmin,
  deleteAdmin,
} from "@/api/superadmin";
import type { Organization, User } from "@/types/superadmin";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

type FormMode = "create-admin" | "create-owner" | "edit-admin";

export function UsersPage() {
  const [mode, setMode] = useState<FormMode>("create-admin");
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [organizationId, setOrganizationId] = useState("");

  const queryClient = useQueryClient();

  const {
    data: admins,
    isLoading: adminsLoading,
    isError: adminsError,
  } = useQuery({
    queryKey: ["superadmin", "users", "admins"],
    queryFn: fetchAdmins,
  });

  const {
    data: organizations,
    isLoading: orgsLoading,
    isError: orgsError,
  } = useQuery({
    queryKey: ["superadmin", "organizations", { forSelect: true }],
    queryFn: () => fetchOrganizations(),
  });

  const adminList = useMemo(() => admins ?? [], [admins]);
  const organizationList: Organization[] = useMemo(
    () => organizations ?? [],
    [organizations]
  );

  const createAdminMutation = useMutation({
    mutationFn: createAdmin,
    onSuccess: () => {
      toast.success("Admin created");
      resetForm();
      queryClient.invalidateQueries({
        queryKey: ["superadmin", "users", "admins"],
      });
    },
    onError: () => {
      toast.error("Failed to create admin");
    },
  });

  const createOwnerMutation = useMutation({
    mutationFn: createOrganizationOwner,
    onSuccess: () => {
      toast.success("Organization owner created");
      resetForm();
    },
    onError: () => {
      toast.error("Failed to create organization owner");
    },
  });

  const updateAdminMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { name?: string; organizationId?: string };
    }) => updateAdmin(id, payload),
    onSuccess: () => {
      toast.success("Admin updated");
      resetForm();
      queryClient.invalidateQueries({
        queryKey: ["superadmin", "users", "admins"],
      });
    },
    onError: () => {
      toast.error("Failed to update admin");
    },
  });

  const deleteAdminMutation = useMutation({
    mutationFn: deleteAdmin,
    onSuccess: () => {
      toast.success("Admin deleted");
      queryClient.invalidateQueries({
        queryKey: ["superadmin", "users", "admins"],
      });
    },
    onError: () => {
      toast.error("Failed to delete admin");
    },
  });

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setOrganizationId("");
    setEditingUser(null);
    setMode("create-admin");
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!organizationId) {
      toast.error("Organization is required");
      return;
    }

    if (mode === "create-admin") {
      if (!email || !password || !name) {
        toast.error("All fields are required");
        return;
      }
      createAdminMutation.mutate({
        email,
        password,
        name,
        organizationId,
      });
    } else if (mode === "create-owner") {
      if (!email || !password || !name) {
        toast.error("All fields are required");
        return;
      }
      createOwnerMutation.mutate({
        email,
        password,
        name,
        organizationId,
      });
    } else if (mode === "edit-admin" && editingUser) {
      updateAdminMutation.mutate({
        id: editingUser.id,
        payload: {
          name: name || undefined,
          organizationId: organizationId || undefined,
        },
      });
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setMode("edit-admin");
    setEmail(user.email ?? "");
    setName(user.name ?? "");
    setPassword("");
    setOrganizationId(user.organizationId ?? user.organization?.id ?? "");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            User management
          </h1>
          <p className="text-sm text-muted-foreground">
            Create and manage admins and organization owners.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr,1.4fr]">
        <Card className="order-2 lg:order-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Admins</CardTitle>
            {(adminsLoading || orgsLoading) && <Spinner />}
          </CardHeader>
          <CardContent>
            {adminsError && (
              <p className="text-sm text-destructive">Failed to load admins.</p>
            )}
            {!adminsLoading && adminList.length === 0 && !adminsError && (
              <p className="text-sm text-muted-foreground">
                No admins found. Create the first admin using the form.
              </p>
            )}

            <ul className="divide-y">
              {adminList.map((admin) => (
                <li
                  key={admin.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {admin.name ?? admin.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {admin.email} · {admin.organization?.name ?? "No org"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Edit admin"
                      onClick={() => handleEdit(admin)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Delete admin"
                      className="text-destructive hover:bg-destructive/10"
                      disabled={deleteAdminMutation.isPending}
                      onClick={() => deleteAdminMutation.mutate(admin.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="order-1 lg:order-2">
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">
                {mode === "create-admin" && "Create admin"}
                {mode === "create-owner" && "Create organization owner"}
                {mode === "edit-admin" && "Edit admin"}
              </CardTitle>

              <div className="inline-flex rounded-md bg-muted p-1 text-xs">
                <Button
                  type="button"
                  size="sm"
                  variant={mode === "create-admin" ? "secondary" : "ghost"}
                  className="h-7 px-2"
                  onClick={() => {
                    resetForm();
                    setMode("create-admin");
                  }}
                >
                  Admin
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={mode === "create-owner" ? "secondary" : "ghost"}
                  className="h-7 px-2"
                  onClick={() => {
                    resetForm();
                    setMode("create-owner");
                  }}
                >
                  Org owner
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="user-name">Name</FieldLabel>
                  <Input
                    id="user-name"
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                  {!name && (
                    <FieldError
                      errors={[
                        {
                          message: "Name is required",
                        },
                      ]}
                    />
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="user-email">Email</FieldLabel>
                  <Input
                    id="user-email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={mode === "edit-admin"}
                  />
                  {!email && mode !== "edit-admin" && (
                    <FieldError
                      errors={[
                        {
                          message: "Email is required",
                        },
                      ]}
                    />
                  )}
                </Field>

                {mode !== "edit-admin" && (
                  <Field>
                    <FieldLabel htmlFor="user-password">Password</FieldLabel>
                    <Input
                      id="user-password"
                      type="password"
                      placeholder="Minimum 4 characters"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    {!password && (
                      <FieldError
                        errors={[
                          {
                            message: "Password is required",
                          },
                        ]}
                      />
                    )}
                  </Field>
                )}

                <Field>
                  <FieldLabel htmlFor="user-org">Organization</FieldLabel>
                  <Select
                    value={organizationId}
                    onValueChange={(value) => setOrganizationId(value)}
                  >
                    <option value="">Select organization</option>
                    {organizationList.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </Select>
                  {!organizationId && (
                    <FieldError
                      errors={[
                        {
                          message: "Organization is required",
                        },
                      ]}
                    />
                  )}
                  {orgsError && (
                    <FieldError
                      errors={[
                        {
                          message: "Failed to load organizations",
                        },
                      ]}
                    />
                  )}
                </Field>
              </FieldGroup>

              <CardFooter className="flex justify-end gap-2 px-0">
                {editingUser && (
                  <Button type="button" variant="ghost" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={
                    createAdminMutation.isPending ||
                    createOwnerMutation.isPending ||
                    updateAdminMutation.isPending
                  }
                >
                  <Plus className="mr-2 size-4" />
                  {mode === "create-admin" && "Create admin"}
                  {mode === "create-owner" && "Create owner"}
                  {mode === "edit-admin" && "Save changes"}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default UsersPage;
