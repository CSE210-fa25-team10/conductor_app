/**
 * Course maps between the Database rows and HTTP/JSON edge layers.
 * It is an intermediate object used to translate between the database and JSON.
 * @param {*} param0
 * @returns A course object with attributes corresponding to the Course entity.
 */
export function Course({ id }) {
  return Object.freeze({ id });
}
