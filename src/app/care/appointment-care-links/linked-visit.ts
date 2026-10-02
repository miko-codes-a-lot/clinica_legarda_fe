export function selectLinkedVisit<T extends { _id: string; state: string }>(visits: readonly T[]) {
  return { current: visits.find(visit => ['waiting', 'in_progress', 'completed'].includes(visit.state)) ?? null, latest: visits[0] ?? null };
}
