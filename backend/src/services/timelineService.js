import { prisma, nullOnRecordNotFound, flattenInjuryName } from '../utils.js';
import { iconFor, categoryFor } from '../entryIcons.js';

// Every function here carries the ownership predicate inside the statement that
// reads or writes, rather than proving it in a separate findFirst first (issue
// #21). The two-step version was correct only for as long as nothing reassigns
// an injury's owner; this version does not depend on that.

// Every timeline event the user has, newest first. See the note on
// getAllSymptomsForUser for why the per-injury fan-out was replaced.
export const getAllEventsForUser = async (userId) => {
  const events = await prisma.timelineEvent.findMany({
    where: {
      injury: {
        userId,
      },
    },
    orderBy: {
      date: 'desc',
    },
    include: {
      injury: {
        select: {
          name: true,
        },
      },
    },
  });

  // Matched on `type` alone. Including the description is what made this
  // inconsistent before: two `doctor_visit` rows drew different icons because
  // one of them happened to mention physical therapy.
  return events.map((event) => ({
    ...flattenInjuryName(event),
    icon: iconFor(event.type),
    category: categoryFor(event.type),
  }));
};

// Create timeline event
//
// `connect` on the @@unique([id, userId]) rather than a bare injuryId: an
// injury that is not this user's simply does not match, so there is no window
// in which the parent could change hands between the check and the insert.
export const createTimelineEvent = async (injuryId, userId, eventData) =>
  nullOnRecordNotFound(() =>
    prisma.timelineEvent.create({
      data: {
        ...eventData,
        injury: {
          connect: {
            id_userId: { id: injuryId, userId },
          },
        },
      },
    })
  );

// Get timeline events
//
// This one keeps two queries. The contract distinguishes `null` (no such
// injury, or not yours -> 404) from `[]` (yours, but nothing recorded -> 200),
// and a single findMany cannot tell those apart -- it returns `[]` for both.
// The ownership filter still goes on the read, so if the injury did change
// hands mid-request the answer is an empty list rather than another user's
// events.
export const getTimelineEvents = async (injuryId, userId) => {
  const injury = await prisma.injury.findFirst({
    where: {
      id: injuryId,
      userId,
    },
  });

  if (!injury) {
    return null;
  }

  const events = await prisma.timelineEvent.findMany({
    where: {
      injuryId,
      injury: {
        userId,
      },
    },
    orderBy: {
      date: 'asc',
    },
  });

  return events;
};

// Update timeline event
export const updateTimelineEvent = async (id, userId, eventData) =>
  nullOnRecordNotFound(() =>
    prisma.timelineEvent.update({
      where: {
        id,
        injury: {
          userId,
        },
      },
      data: eventData,
    })
  );

// Delete timeline event
export const deleteTimelineEvent = async (id, userId) =>
  nullOnRecordNotFound(() =>
    prisma.timelineEvent.delete({
      where: {
        id,
        injury: {
          userId,
        },
      },
    })
  );
