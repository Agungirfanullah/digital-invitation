import { describe, expect, it } from "vitest";

import {
  MAX_FILES_PER_BATCH,
  countByStatus,
  describeBatch,
  formatFileSize,
  limitBatch,
  precheckFile,
  type UploadEntry,
} from "@/lib/editor/upload-queue";

const FIVE_MB = 5 * 1024 * 1024;

function entry(status: UploadEntry["status"], id: string = status): UploadEntry {
  return { id, name: `${id}.png`, size: 1000, status };
}

describe("precheckFile", () => {
  it("accepts the four supported image types up to the size limit", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp", "image/gif"]) {
      expect(precheckFile({ type, size: 1234 }, FIVE_MB), type).toBeNull();
    }
    expect(precheckFile({ type: "image/png", size: FIVE_MB }, FIVE_MB)).toBeNull();
  });

  it("rejects other formats, including a missing type", () => {
    for (const type of ["application/pdf", "text/plain", "image/svg+xml", "video/mp4", ""]) {
      expect(precheckFile({ type, size: 100 }, FIVE_MB), type).toMatch(/Format tidak didukung/);
    }
  });

  it("rejects empty and oversized files with a size message", () => {
    expect(precheckFile({ type: "image/png", size: 0 }, FIVE_MB)).toBe("Berkas kosong.");
    expect(precheckFile({ type: "image/png", size: FIVE_MB + 1 }, FIVE_MB)).toBe(
      "Ukuran melebihi 5MB.",
    );
  });
});

describe("limitBatch", () => {
  it("keeps everything under the cap and reports nothing dropped", () => {
    expect(limitBatch([1, 2, 3], 20)).toEqual({ kept: [1, 2, 3], dropped: 0 });
  });

  it("keeps the first N and counts the rest", () => {
    const items = Array.from({ length: 25 }, (_, index) => index);
    const { kept, dropped } = limitBatch(items, MAX_FILES_PER_BATCH);
    expect(kept).toHaveLength(20);
    expect(kept[0]).toBe(0);
    expect(kept[19]).toBe(19);
    expect(dropped).toBe(5);
  });
});

describe("formatFileSize", () => {
  it("uses B, KB and MB with an Indonesian decimal comma", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2 KB");
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe("1,5 MB");
  });
});

describe("countByStatus / describeBatch", () => {
  it("counts each status", () => {
    const counts = countByStatus([
      entry("done", "a"),
      entry("done", "b"),
      entry("error"),
      entry("ready"),
    ]);
    expect(counts).toEqual({ ready: 1, uploading: 0, done: 2, error: 1 });
  });

  it("is empty for an empty queue", () => {
    expect(describeBatch([], false)).toBe("");
    expect(describeBatch([], true)).toBe("");
  });

  it("shows which photo is being uploaded out of how many", () => {
    const entries = [entry("done", "a"), entry("uploading", "b"), entry("ready", "c")];
    expect(describeBatch(entries, true)).toBe("Mengunggah 2 dari 3...");
  });

  it("summarizes a finished batch, naming failures and anything left unsent", () => {
    expect(describeBatch([entry("done", "a"), entry("done", "b")], false)).toBe(
      "2 foto berhasil diunggah.",
    );
    expect(describeBatch([entry("done", "a"), entry("error", "b")], false)).toBe(
      "1 foto berhasil diunggah, 1 gagal.",
    );
    expect(describeBatch([entry("done", "a"), entry("ready", "b")], false)).toBe(
      "1 foto berhasil diunggah, 1 belum diunggah.",
    );
  });

  it("describes a fresh selection by what can and cannot be sent, not as an outcome", () => {
    expect(describeBatch([entry("ready", "a"), entry("ready", "b")], false)).toBe(
      "2 berkas siap diunggah.",
    );
    expect(describeBatch([entry("ready", "a"), entry("error", "b")], false)).toBe(
      "1 berkas siap diunggah, 1 tidak bisa diunggah.",
    );
    expect(describeBatch([entry("error", "a")], false)).toBe(
      "Tidak ada berkas yang bisa diunggah.",
    );
  });
});
