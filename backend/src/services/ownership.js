// Several read functions across these services follow the same shape: does
// the parent resource (an Injury, or a Treatment for its outcomes) exist and
// belong to this user, before listing what hangs off it (issue #18).
//
// This is deliberately NOT used for create/update/delete. Those used to
// follow the same "check first, then mutate by bare id" shape, but that had a
// TOCTOU gap -- the row could change hands between the check and the mutation
// (issue #21) -- so they now fold the ownership check into the mutation's own
// `where`/`connect` and rely on `nullOnRecordNotFound` (utils.js) instead. A
// read has no second step to race against, so the two-query shape here is
// fine.
//
// `ownershipWhere` is a plain Prisma where-fragment, not a relation-path
// string to parse: every call site already knows its exact ownership shape
// (`{ userId }` for a direct column, `{ injury: { userId } }` for a one-hop
// relation), so it can just pass that fragment straight through.
export const findOwnedResource = (model, id, ownershipWhere) =>
  model.findFirst({
    where: {
      id,
      ...ownershipWhere,
    },
  });
