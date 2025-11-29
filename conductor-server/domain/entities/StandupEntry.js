/**
 * StandupEntry maps database rows to backend entity
 */
export function StandupEntry({
  standup_id,
  user_id,
  name,
  time,
  content,
  sentiment // Now represents the combined sentiment data (personal, team, course)
}) {
  return Object.freeze({
    standup_id,
    user_id,
    name,
    time,
    content,
    sentiment
  });
}

