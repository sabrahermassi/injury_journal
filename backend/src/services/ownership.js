// Cross-user data isolation is the single most security-critical invariant in
// this app (see .claude/claude-security-guidance.md, "Authorization and data
// ownership"). Before this helper existed, every update/delete function across
// injury/timeline/symptom/treatment/medicalVisit(/treatmentOutcome) services
// repeated the same shape by hand: findFirst with an ownership filter, return
// null if not found, otherwise mutate by bare id. Centralizing it here means a
// future change to how the check works lands in one place instead of ~19
// (issue #18).
//
// `ownershipWhere` is a plain Prisma where-fragment, not a relation-path
// string to parse: every call site already knows its exact ownership shape
// (`{ userId }` for a direct column, `{ injury: { userId } }` for a one-hop
// relation, `{ treatment: { injury: { userId } } }` for two hops), so it can
// just pass that fragment straight through.
//
// Returns the record or null -- it does not throw -- so callers keep the
// existing `if (!x) return null` -> controller `404` pattern (CLAUDE.md §7:
// 404 for both "doesn't exist" and "belongs to someone else", deliberately,
// to avoid leaking existence of other users' records).
export const findOwnedResource = (model, id, ownershipWhere) =>
  model.findFirst({
    where: {
      id,
      ...ownershipWhere,
    },
  });
