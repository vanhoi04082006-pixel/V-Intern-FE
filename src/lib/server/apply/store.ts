/**
 * Store in-memory cho domain "Tuyển dụng công khai & Nghề nghiệp".
 * Gắn trên globalThis (`__vintern_apply_store__`) sống qua HMR — pattern giống
 * store.ts chính nhưng hoàn toàn độc lập: KHÔNG sửa store.ts/types.ts chung.
 */

import type { ApplyStore, CareerRoleRecord, RoundRecord, SlotRecord, ApplicationRecord, TimelineEvent } from "./types";
import { SEED_VERSION, seedApplyStore, topUpQuestionBank } from "./seed";
import { getStore } from "../store";
import { nowIso, randomId } from "../util";

const GLOBAL_KEY = "__vintern_apply_store__";

const globalRef = globalThis as unknown as { [GLOBAL_KEY]?: ApplyStore };

export function getApplyStore(): ApplyStore {
  if (!globalRef[GLOBAL_KEY] || globalRef[GLOBAL_KEY]!.seedVersion !== SEED_VERSION) {
    globalRef[GLOBAL_KEY] = seedApplyStore();
    // Bổ sung câu hỏi phỏng vấn cho 5 role onboarding đạt ngưỡng mở khung giờ (≥10 câu).
    topUpQuestionBank(getStore());
  }
  return globalRef[GLOBAL_KEY]!;
}

/* ------------------------- Truy vấn tiện ích domain ------------------------- */

export function findRound(idOrCode: string): RoundRecord | undefined {
  const key = idOrCode.trim();
  return getApplyStore().rounds.find((r) => r.id === key || r.code === key);
}

export function findSlot(roundId: string, slotId: string): SlotRecord | undefined {
  return getApplyStore().slots.find((s) => s.id === slotId && s.roundId === roundId);
}

export function findApplication(roundId: string, appId: string): ApplicationRecord | undefined {
  return getApplyStore().applications.find((a) => a.id === appId && a.roundId === roundId);
}

export function findApplicationByEmail(email: string, roundId: string): ApplicationRecord | undefined {
  const e = email.trim().toLowerCase();
  return getApplyStore().applications.find((a) => a.email.toLowerCase() === e && a.roundId === roundId);
}

export function findCareerRole(code: string): CareerRoleRecord | undefined {
  return getApplyStore().careerRoles.find((r) => r.code === code);
}

export function timelineOf(applicationId: string): TimelineEvent[] {
  return getApplyStore()
    .timelineEvents.filter((e) => e.applicationId === applicationId)
    .sort((a, b) => (a.at < b.at ? -1 : 1));
}

export function pushTimeline(
  applicationId: string,
  kind: TimelineEvent["kind"],
  message: string,
  actor: string
): TimelineEvent {
  const store = getApplyStore();
  const event: TimelineEvent = {
    id: randomId("ate"),
    applicationId,
    kind,
    message,
    actor,
    at: nowIso(),
  };
  store.timelineEvents.push(event);
  return event;
}

/** Số chỗ đã đặt của một khung giờ (luôn tính từ hồ sơ booked — không drift). */
export function slotBookedCount(slotId: string): number {
  return getApplyStore().applications.filter((a) => a.status === "booked" && a.booking?.slotId === slotId).length;
}

/** Mã đợt tuyển mới: RR-YYYY-NN với NN = số đợt trong năm + 1. */
export function nextRoundCode(): string {
  const year = new Date().getFullYear();
  const count = getApplyStore().rounds.filter((r) => r.code.startsWith(`RR-${year}`)).length;
  return `RR-${year}-${String(count + 1).padStart(2, "0")}`;
}
