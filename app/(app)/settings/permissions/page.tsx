
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
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      setMessage("");

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .order("full_name");

      if (error) {
        setMessage(`Could not load users: ${error.message}`);
        setLoading(false);
        return;
      }

      const validUsers = (profileData ?? []) as Profile[];
      setUsers(validUsers);

      const firstNonAdmin = validUsers.find(
        (user) => user.role !== "admin"
      );

      if (firstNonAdmin) {
        setSelectedUser(firstNonAdmin.id);
      }

      setLoading(false);
    }

    void loadUsers();
  }, [supabase]);

  useEffect(() => {
    async function loadPermissions() {
      if (!selectedUser) {
        setPermissions([]);
        return;
      }

      setMessage("");

      const { data, error } = await supabase
        .from("user_section_permissions")
        .select("section_key, can_view, can_edit")
        .eq("user_id", selectedUser);

      if (error) {
        setMessage(`Could not load permissions: ${error.message}`);
        setPermissions([]);
        return;
      }

      setPermissions((data ?? []) as SectionPermission[]);
    }

    void loadPermissions();
  }, [selectedUser, supabase]);

  function permissionFor(sectionKey: string) {
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

      const next = existing
        ? { ...existing, [field]: value }
        : {
            section_key: sectionKey,
            can_view: false,
            can_edit: false,
            [field]: value,
          };

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
    if (!selectedUser) return;

    setSaving(true);
    setMessage("");

    try {
      const chosenUser = users.find(
        (user) => user.id === selectedUser
      );

      if (!chosenUser || chosenUser.role === "admin") {
        setMessage(
          "Admins always have full access; their permissions cannot be restricted here."
        );
        return;
      }

      const rows = SECTIONS.map((section) => {
        const permission = permissionFor(section.key);

        return {
          user_id: selectedUser,
          section_key: section.key,
          can_view: permission.can_view,
          can_edit: permission.can_edit,
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
      setMessage("Something went wrong while saving permissions. Please try again.");
    } finally {
      setSaving(false);
    }
  }


  if (loading) {
    return <main className="p-6">Loading users…</main>;
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
            .filter((user) => user.role !== "admin")
            .map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name || "Unnamed user"} ({user.role})
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
