import { prisma, flattenInjuryName } from '../utils.js';
import { iconFor, categoryFor } from '../entryIcons.js';

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
export const createTimelineEvent = async (injuryId, userId, eventData) => {
  // Check injury belongs to user
  const injury = await prisma.injury.findFirst({
    where: {
      id: injuryId,
      userId,
    },
  });

  if (!injury) {
    return null;
  }

  const event = await prisma.timelineEvent.create({
    data: {
      ...eventData,
      injuryId,
    },
  });

  return event;
};

// Get timeline events
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
    },
    orderBy: {
      date: 'asc',
    },
  });

  return events;
};

// Update timeline event
export const updateTimelineEvent = async (id, userId, eventData) => {
  const event = await prisma.timelineEvent.findFirst({
    where: {
      id,
      injury: {
        userId,
      },
    },
  });

  if (!event) {
    return null;
  }

  const updatedEvent = await prisma.timelineEvent.update({
    where: {
      id,
    },
    data: eventData,
  });

  return updatedEvent;
};

// Delete timeline event
export const deleteTimelineEvent = async (id, userId) => {
  const event = await prisma.timelineEvent.findFirst({
    where: {
      id,
      injury: {
        userId,
      },
    },
  });

  if (!event) {
    return null;
  }

  const deletedEvent = await prisma.timelineEvent.delete({
    where: {
      id,
    },
  });

  return deletedEvent;
};
