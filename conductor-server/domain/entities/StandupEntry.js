/**
 * StandupEntry maps database rows to backend entity
 */
export function StandupEntry({
  standup_id,
  user_id,
  name,
  time,
  content,
  sentiment_personal,
  sentiment_team,
  sentiment_course,
}) {
  return Object.freeze({
    standup_id,
    user_id,
    name,
    time,
    content,
    sentiment_personal,
    sentiment_team,
    sentiment_course,
  });
}
