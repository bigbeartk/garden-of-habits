import type { Messages } from './vi';

export const en: Messages = {
  nav: {
    tabs: { calendar: 'Calendar', today: 'Today', garden: 'Garden', settings: 'Settings' },
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    backToCalendar: 'Back to Calendar',
    backToSettings: 'Back to Settings',
  },
  language: { title: 'Ngôn ngữ · Language' },
  period: { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' },
  stage: { seed: 'Seed', sprout: 'Sprout', bud: 'Bud', bloom: 'Bloom' },
  calendar: {
    weekdaysShort: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    prevMonth: 'Previous month',
    nextMonth: 'Next month',
  },
  errors: {
    dayLocked: (p) => `${p.date} is in the past — only the note can be changed.`,
    dayNotFound: (p) => `Couldn't find the day ${p.date}`,
    todoNotFound: () => "Couldn't find that task",
    emptyTask: () => "A task can't be empty",
    emptyReminder: () => "A reminder can't be empty",
    emptyTemplateName: () => "The template name can't be empty",
    templateNotFound: () => "Couldn't find that template",
    reminderNotFound: () => "Couldn't find that reminder",
    plannedNotFuture: () => 'You can only plan days after today',
    specialLocked: () => "This special plant isn't unlocked yet",
    styleLocked: () => "This plant style isn't unlocked yet",
    unknownPlant: (p) => `Unknown plant "${p.id}"`,
    unknownPot: (p) => `Unknown pot "${p.id}"`,
    unknownStyle: (p) => `Unknown style "${p.id}"`,
  },
  backup: {
    errors: {
      notJson: () => "This file isn't valid JSON.",
      wrongFormat: () => "This isn't a Garden of Habits backup file.",
      tooNew: () => 'This backup was made by a newer version of the app. Please update the app and try again.',
      corrupt: (path) => `The backup file is damaged or missing data (at "${path ?? ''}").`,
    },
  },
};
