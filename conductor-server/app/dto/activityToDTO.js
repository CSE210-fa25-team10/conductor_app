/**
 * activityToDTO transfers the intermediate User class to a JSON Data-Transfer-Object.
 * This is useful for returning activites as JSON objects to the frontend.
 * @param {*} Activity
 * @returns JSON object representing Activity.
 */
export function activityToDTO(Activity) {
  return {
    'activity.activityId': Activity.activityId,
    'activity.courseId': Activity.courseId,
    'activity.name': Activity.name,
    'activity.time': Activity.time,
    'activity.type': Activity.type,
  };
}
