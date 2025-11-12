/**
 * Activity maps between the Database rows and HTTP/JSON edge layers. 
 * It is an intermediate object used to translate between the database and JSON.
 * @param {*} param0 
 * @returns A activity object with attributes corresponding to the Activity entity.
 */
export function Activity({ activityId, courseId, name, time, type }) {
  return Object.freeze({ activityId, courseId, name, time, type });
}