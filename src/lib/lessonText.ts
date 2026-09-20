import i18n from '../i18n';
import type { Lesson, LessonSection } from '../data/digitalLessons';

// The built-in digital lessons are written in English in src/data/digitalLessons.ts. Their words in
// isiXhosa and Afrikaans live in the locale files under lessons.<id>.*, and the English is the fallback.
const say = (key: string, fallback: string) => i18n.t(`lessons.${key}`, { defaultValue: fallback });

export const sectionTitle = (section: LessonSection) => say(`${section.id}.title`, section.title);
export const sectionSubtitle = (section: LessonSection) => say(`${section.id}.subtitle`, section.subtitle);
export const lessonTitle = (lesson: Lesson) => say(`${lesson.id}.title`, lesson.title);
export const lessonSummary = (lesson: Lesson) => say(`${lesson.id}.summary`, lesson.summary);
export const lessonDesc = (lesson: Lesson) => say(`${lesson.id}.desc`, lesson.desc);
export const lessonTip = (lesson: Lesson) => say(`${lesson.id}.tip`, lesson.tip);
export const lessonSteps = (lesson: Lesson) => lesson.steps.map((step, index) => say(`${lesson.id}.steps.${index}`, step));
