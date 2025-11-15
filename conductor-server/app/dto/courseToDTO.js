/**
 * courseToDTO transfers the intermediate Course class to a JSON Data-Transfer-Object.
 * This is useful for returning courses as JSON objects to the frontend.
 * @param {*} Course
 * @returns JSON object representing Course.
 */
export function courseToDTO(Course) {
  return {
    'course.id': Course.id,
  };
}
