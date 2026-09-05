import { prisma } from '../utils.js';
import { findOwnedResource } from './ownership.js';

// Create timeline event
export const createTimelineEvent = async (injuryId, userId, eventData) => {
  // Check injury belongs to user
  const injury = await findOwnedResource(prisma.injury, injuryId, { userId });

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
  const injury = await findOwnedResource(prisma.injury, injuryId, { userId });

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
  const event = await findOwnedResource(prisma.timelineEvent, id, {
    injury: {
      userId,
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
  const event = await findOwnedResource(prisma.timelineEvent, id, {
    injury: {
      userId,
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
