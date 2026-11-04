"use client";

import { useActionState, useState } from "react";
import type { UserRole } from "@prisma/client";

import {
  deleteEventAction,
  deleteUserAction,
  setTemplateActiveAction,
  setUserRoleAction,
  setUserSuspendedAction,
  unpublishEventAction,
  type AdminActionState,
} from "@/lib/admin/actions";
import { FormError } from "@/components/forms/form-error";
import { Button } from "@/components/ui/button";

const initial: AdminActionState = {};

function Feedback({ state }: { state: AdminActionState }) {
  return (
    <>
      <FormError message={state.error} />
      {state.success && (
        <p role="status" className="text-xs font-medium text-emerald-700">
          {state.success}
        </p>
      )}
    </>
  );
}

export function RoleForm({ userId, role }: { userId: string; role: UserRole }) {
  const [state, action, pending] = useActionState(setUserRoleAction.bind(null, userId), initial);
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <div className="space-y-1.5">
        <label htmlFor="admin-role" className="text-sm font-medium">
          Role
        </label>
        <select
          id="admin-role"
          name="role"
          defaultValue={role}
          className="border-input bg-card block h-9 rounded-lg border px-3 text-sm"
        >
          <option value="USER">Pengguna</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Menyimpan..." : "Simpan role"}
      </Button>
      <div className="basis-full">
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function SuspendForm({ userId, suspended }: { userId: string; suspended: boolean }) {
  const [state, action, pending] = useActionState(
    setUserSuspendedAction.bind(null, userId, !suspended),
    initial,
  );
  return (
    <form action={action} className="space-y-2">
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Memproses..." : suspended ? "Aktifkan kembali akun" : "Nonaktifkan akun"}
      </Button>
      <Feedback state={state} />
    </form>
  );
}

export function DeleteUserForm({ userId, email }: { userId: string; email: string }) {
  const [state, action, pending] = useActionState(
    deleteUserAction.bind(null, userId, email),
    initial,
  );
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <Button type="button" size="sm" variant="outline" onClick={() => setConfirming(true)}>
        Hapus pengguna
      </Button>
    );
  }
  return (
    <form action={action} className="space-y-3">
      <p className="text-muted-foreground text-sm">
        Semua acara, tamu, file, dan login pengguna ini dihapus permanen. Ketik{" "}
        <span className="text-foreground font-medium">{email}</span> untuk konfirmasi.
      </p>
      <label htmlFor="admin-confirm-email" className="sr-only">
        Email konfirmasi
      </label>
      <input
        id="admin-confirm-email"
        name="confirmEmail"
        autoComplete="off"
        className="border-input bg-card h-9 w-full rounded-lg border px-3 text-sm"
      />
      <Feedback state={state} />
      <div className="flex gap-2">
        <Button type="submit" size="sm" variant="destructive" disabled={pending}>
          {pending ? "Menghapus..." : "Hapus permanen"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => setConfirming(false)}
        >
          Batal
        </Button>
      </div>
    </form>
  );
}

export function EventAdminActions({
  eventId,
  title,
  published,
}: {
  eventId: string;
  title: string;
  published: boolean;
}) {
  const [unpublishState, unpublish, unpublishing] = useActionState(
    unpublishEventAction.bind(null, eventId),
    initial,
  );
  const [deleteState, remove, deleting] = useActionState(
    deleteEventAction.bind(null, eventId),
    initial,
  );
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap justify-end gap-1.5">
        {published && (
          <form action={unpublish}>
            <Button type="submit" size="sm" variant="outline" disabled={unpublishing}>
              {unpublishing ? "Memproses..." : "Batalkan publikasi"}
            </Button>
          </form>
        )}
        {confirming ? (
          <form action={remove} className="flex gap-1.5">
            <Button
              type="submit"
              size="sm"
              variant="destructive"
              disabled={deleting}
              aria-label={`Ya, hapus ${title}`}
            >
              {deleting ? "Menghapus..." : "Ya, hapus"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setConfirming(false)}>
              Batal
            </Button>
          </form>
        ) : (
          <Button type="button" size="sm" variant="ghost" onClick={() => setConfirming(true)}>
            Hapus
          </Button>
        )}
      </div>
      <Feedback
        state={unpublishState.error || unpublishState.success ? unpublishState : deleteState}
      />
    </div>
  );
}

export function TemplateToggle({ templateId, active }: { templateId: string; active: boolean }) {
  const [state, action, pending] = useActionState(
    setTemplateActiveAction.bind(null, templateId, !active),
    initial,
  );
  return (
    <form action={action} className="space-y-1">
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Memproses..." : active ? "Nonaktifkan" : "Aktifkan"}
      </Button>
      <Feedback state={state} />
    </form>
  );
}
