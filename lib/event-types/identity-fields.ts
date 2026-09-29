import type { EventType } from "@prisma/client";

import { EVENT_TYPE_CONFIG } from "@/lib/event-types/config";

/**
 * Editor field definitions per event type — drives the single, data-driven
 * identity form (components/editor/sections/identity-form.tsx) instead of
 * one hand-written form per type. Keys are the canonical identity data keys
 * of the type's family (lib/event-types/identity.ts). Client-safe.
 */

export type IdentityFieldKind = "text" | "number" | "date";

export interface IdentityFieldDef {
  key: string;
  label: string;
  kind: IdentityFieldKind;
  placeholder?: string;
  hint?: string;
}

export interface IdentityFieldGroup {
  legend: string | null;
  fields: IdentityFieldDef[];
}

const REQUIRED_NAME_HINT = "Wajib diisi (nama lengkap atau panggilan) sebelum dipublikasikan.";
const REQUIRED_HINT = "Wajib diisi sebelum dipublikasikan.";

function coupleMemberFields(prefix: "bride" | "groom"): IdentityFieldDef[] {
  return [
    { key: `${prefix}FullName`, label: "Nama lengkap", kind: "text", hint: REQUIRED_NAME_HINT },
    { key: `${prefix}Nickname`, label: "Nama panggilan", kind: "text" },
    { key: `${prefix}Father`, label: "Nama ayah", kind: "text" },
    { key: `${prefix}Mother`, label: "Nama ibu", kind: "text" },
    { key: `${prefix}Instagram`, label: "Instagram", kind: "text", placeholder: "tanpa @" },
  ];
}

/** Field groups for `type`; empty for OTHER, which has no identity form (docs/PRD.md §13.7). */
export function getIdentityFieldGroups(type: EventType): IdentityFieldGroup[] {
  const config = EVENT_TYPE_CONFIG[type];

  switch (config.family) {
    case "COUPLE": {
      const groups: IdentityFieldGroup[] = [
        { legend: config.coupleLabels?.first ?? null, fields: coupleMemberFields("bride") },
        { legend: config.coupleLabels?.second ?? null, fields: coupleMemberFields("groom") },
      ];
      if (type === "ANNIVERSARY") {
        groups.push({
          legend: "Perayaan",
          fields: [{ key: "yearsTogether", label: "Usia pernikahan (tahun)", kind: "number" }],
        });
      }
      return groups;
    }
    case "PERSON":
      return [
        {
          legend: null,
          fields: [
            { key: "fullName", label: "Nama lengkap", kind: "text", hint: REQUIRED_NAME_HINT },
            { key: "nickname", label: "Nama panggilan", kind: "text" },
            { key: "age", label: "Usia yang dirayakan", kind: "number" },
            {
              key: "milestone",
              label: "Keterangan",
              kind: "text",
              placeholder: "mis. Sweet Seventeen",
            },
            {
              key: "hostedBy",
              label: "Diselenggarakan oleh",
              kind: "text",
              placeholder: "mis. Keluarga Bapak Andi",
            },
            { key: "instagram", label: "Instagram", kind: "text", placeholder: "tanpa @" },
          ],
        },
      ];
    case "BABY_FAMILY":
      return [
        {
          legend: "Buah Hati",
          fields: [
            { key: "babyFullName", label: "Nama lengkap", kind: "text", hint: REQUIRED_NAME_HINT },
            { key: "babyNickname", label: "Nama panggilan", kind: "text" },
            { key: "birthDate", label: "Tanggal lahir", kind: "date" },
            {
              key: "birthDetails",
              label: "Keterangan kelahiran",
              kind: "text",
              placeholder: "mis. Anak pertama",
            },
          ],
        },
        {
          legend: "Orang Tua",
          fields: [
            {
              key: "fatherName",
              label: "Nama ayah",
              kind: "text",
              hint: "Isi minimal salah satu nama orang tua sebelum dipublikasikan.",
            },
            { key: "motherName", label: "Nama ibu", kind: "text" },
          ],
        },
      ];
    case "HOST_GROUP":
      return [
        {
          legend: null,
          fields: [
            {
              key: "hostName",
              label: "Nama tuan rumah / penyelenggara",
              kind: "text",
              hint: REQUIRED_HINT,
            },
            { key: "occasionTheme", label: "Tema acara", kind: "text" },
            {
              key: "contactInfo",
              label: "Kontak",
              kind: "text",
              hint: "Ditampilkan di undangan publik.",
            },
          ],
        },
      ];
    case "ORGANIZATION":
      return [
        {
          legend: null,
          fields: [
            {
              key: "organizationName",
              label: "Nama organisasi / perusahaan",
              kind: "text",
              hint: REQUIRED_HINT,
            },
            {
              key: "contactPerson",
              label: "Narahubung",
              kind: "text",
              hint: "Ditampilkan di undangan publik.",
            },
            { key: "dressCode", label: "Dress code", kind: "text" },
          ],
        },
      ];
    case "GENERIC":
      return [];
  }
}
