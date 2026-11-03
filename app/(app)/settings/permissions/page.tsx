
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type UserRole = "admin" | "family" | "volunteer";

type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
};

type SectionPermission = {
  section_key: string;
  can_view: boolean;
  can_edit: boolean;
};

const SECTIONS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "events", label: "Events" },
  { key: "guests", label: "Guests" },
  { key: "tasks", label: "Tasks" },
  { key: "shopping", label: "Shopping" },
  { key: "budget", label: "Budget" },
  { key: "vendors", label: "Vendors" },
  { key: "bookings", label: "Bookings" },
  { key: "notes", label: "Notes" },
  { key: "decisions", label: "Decisions" },
  { key: "files", label: "Files" },
];

export default function PermissionsPage() {
  const [supabase] = useState(() => createClient());
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [permissions, setPermissions] = useState<SectionPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessChecked, setAccessChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        window.location.href = "/login";
        return;
      }

      const { data: myProfile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (cancelled) return;

      if (profileError || myProfile?.role !== "admin") {
        setMessage("Access denied. Only admins can manage permissions.");
        setLoading(false);
        setAccessChecked(true);
        return;
      }

      setAccessChecked(true);

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .order("full_name");

      if (cancelled) return;

      if (error) {
        setMessage(`Could not load users: ${error.message}`);
        setLoading(false);
        return;
      }

      const validUsers = (profileData ?? []) as Profile[];
      setUsers(validUsers);

      const firstNonAdmin = validUsers.find(
        (profile) => profile.role !== "admin"
      );

      if (firstNonAdmin) {
        setSelectedUser(firstNonAdmin.id);
      }

      setLoading(false);
    }

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;

    async function loadPermissions() {
      if (!selectedUser || !accessChecked || message.startsWith("Access denied")) {
        setPermissions([]);
        return;
      }

      setMessage("");

      const { data, error } = await supabase
        .from("user_section_permissions")
        .select("section_key, can_view, can_edit")
        .eq("user_id", selectedUser);

      if (cancelled) return;

      if (error) {
        setMessage(`Could not load permissions: ${error.message}`);
        setPermissions([]);
        return;
      }

      setPermissions((data ?? []) as SectionPermission[]);
    }

    void loadPermissions();

    return () => {
      cancelled = true;
    };
  }, [selectedUser, supabase, accessChecked, message]);

  function permissionFor(sectionKey: string): SectionPermission {
    return (
      permissions.find((item) => item.section_key === sectionKey) ?? {
        section_key: sectionKey,
        can_view: false,
        can_edit: false,
      }
    );
  }

  function changePermission(
    sectionKey: string,
    field: "can_view" | "can_edit",
    value: boolean
  ) {
    setPermissions((current) => {
      const existing = current.find(
        (item) => item.section_key === sectionKey
      );

      const next: SectionPermission = existing
        ? { ...existing, [field]: value }
        : {
            section_key: sectionKey,
            can_view: false,
            can_edit: false,
          };

      next[field] = value;

      if (field === "can_view" && !value) {
        next.can_edit = false;
      }

      if (field === "can_edit" && value) {
        next.can_view = true;
      }

      return [
        ...current.filter((item) => item.section_key !== sectionKey),
        next,
      ];
    });
  }

  async function savePermissions() {
    if (!selectedUser || saving) return;

    setSaving(true);
    setMessage("");

    try {
      const chosenUser = users.find(
        (profile) => profile.id === selectedUser
      );

      if (!chosenUser || chosenUser.role === "admin") {
        setMessage(
          "Admins always have full access; their permissions cannot be restricted here."
        );
        return;
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setMessage("Your session has expired. Please sign in again.");
        return;
      }

      const { data: myProfile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError || myProfile?.role !== "admin") {
        setMessage("Access denied. Only admins can manage permissions.");
        return;
      }

      const rows = SECTIONS.map((section) => {
        const permission = permissionFor(section.key);

        return {
          user_id: selectedUser,
          section_key: section.key,
          can_view: permission.can_view,
          can_edit: permission.can_edit,
          updated_by: user.id,
        };
      });

      const { error } = await supabase
        .from("user_section_permissions")
        .upsert(rows, {
          onConflict: "user_id,section_key",
        });

      if (error) {
        setMessage(`Could not save permissions: ${error.message}`);
        return;
      }

      setMessage("Permissions saved successfully.");
    } catch {
      setMessage(
        "Something went wrong while saving permissions. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading || !accessChecked) {
    return <main className="p-6">Checking access…</main>;
  }

  if (message.startsWith("Access denied")) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <h1 className="text-xl font-semibold">Access denied</h1>
        <p className="mt-2 text-sm text-gray-600">
          Only admins can manage user permissions.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">User permissions</h1>
        <p className="mt-2 text-sm text-gray-600">
          Choose what each family member or volunteer can view and edit.
          Admins always retain full access.
        </p>
      </div>

      <section className="space-y-4 rounded-xl border p-5">
        <label htmlFor="user-select" className="block font-medium">
          Select user
        </label>

        <select
          id="user-select"
          className="w-full rounded-lg border p-3"
          value={selectedUser}
          onChange={(event) => setSelectedUser(event.target.value)}
        >
          <option value="">Choose a user…</option>
          {users
            .filter((profile) => profile.role !== "admin")
            .map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.full_name || "Unnamed user"} ({profile.role})
              </option>
            ))}
        </select>
      </section>

      {selectedUser && (
        <section className="overflow-hidden rounded-xl border">
          <div className="border-b p-4">
            <h2 className="font-semibold">Section access</h2>
            <p className="mt-1 text-sm text-gray-600">
              Editing automatically enables viewing.
            </p>
          </div>

          <div className="divide-y">
            {SECTIONS.map((section) => {
              const permission = permissionFor(section.key);

              return (
                <div
                  key={section.key}
                  className="flex flex-wrap items-center justify-between gap-4 p-4"
                >
                  <span className="font-medium">{section.label}</span>

                  <div className="flex gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={permission.can_view}
                        onChange={(event) =>
                          changePermission(
                            section.key,
                            "can_view",
                            event.target.checked
                          )
                        }
                      />
                      View
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={permission.can_edit}
                        onChange={(event) =>
                          changePermission(
                            section.key,
                            "can_edit",
                            event.target.checked
                          )
                        }
                      />
                      Edit
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t p-4">
            <button
              type="button"
              onClick={savePermissions}
              disabled={saving}
              className="rounded-lg bg-black px-5 py-3 font-medium text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save permissions"}
            </button>
          </div>
        </section>
      )}

      {message && (
        <p role="status" className="rounded-lg border p-3 text-sm">
          {message}
        </p>
      )}
    </main>
  );
}
