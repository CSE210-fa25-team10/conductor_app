/**
 * AnonymousFeedback maps database rows to backend entity for course/team feedback
 */
export function AnonymousFeedback({ feedback_id, course_id, type, message, created_at }) {
  return Object.freeze({
    feedback_id,
    course_id,
    type,
    message,
    created_at,
  });
}
