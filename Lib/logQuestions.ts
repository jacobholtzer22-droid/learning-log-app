/**
 * Type-specific reflection questions for learning logs.
 * Used when creating/editing logs and when viewing them so the same questions appear.
 */

export type ContentType = 'podcast' | 'book' | 'course' | 'article' | 'video' | 'other'

export interface LogQuestions {
  q1: string
  q2: string
  q3: string // optional
}

const questionsByType: Record<ContentType, LogQuestions> = {
  podcast: {
    q1: 'What are the 2 to 3 biggest ideas you remember from this episode?',
    q2: 'Pick 1. Teach it back in your own words. What was the logic or evidence?',
    q3: 'What is one thing you could do this week because of it?',
  },
  book: {
    q1: 'What are the 2 to 3 key ideas you remember from what you read?',
    q2: 'Pick 1. Explain it like you are teaching someone. What does it mean and why is it true?',
    q3: 'Where would this show up in your life, school, or work this week?',
  },
  course: {
    q1: 'What are the 2 to 3 key concepts you remember from this lesson?',
    q2: 'Pick 1. Teach it back step by step in your own words.',
    q3: 'What is a real example or practice scenario where this concept applies?',
  },
  article: {
    q1: 'What are the 2 to 3 key ideas you remember?',
    q2: 'Pick 1. Teach it back in your own words.',
    q3: 'What is one thing you could do or apply because of it?',
  },
  video: {
    q1: 'What are the 2 to 3 key ideas you remember?',
    q2: 'Pick 1. Teach it back in your own words.',
    q3: 'What is one thing you could do or apply because of it?',
  },
  other: {
    q1: 'What are the 2 to 3 key ideas you remember?',
    q2: 'Pick 1. Teach it back in your own words.',
    q3: 'What is one thing you could do or apply because of it?',
  },
}

export function getLogQuestions(contentType: string): LogQuestions {
  const type = (contentType?.toLowerCase() || 'book') as ContentType
  return questionsByType[type] ?? questionsByType.other
}
