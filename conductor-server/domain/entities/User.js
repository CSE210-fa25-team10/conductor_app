/**
 * User maps between the Database rows and HTTP/JSON edge layers.
 * It is an intermediate object used to translate between the database and JSON.
 * @param {*} param0
 * @returns A user object with attributes corresponding to the User entity.
 */
export function User({
  id,
  name,
  pronunciation,
  pronouns,
  profilePhoto,
  email,
  slack,
  phone,
  avaliability,
}) {
  return Object.freeze({
    id,
    name,
    pronunciation,
    pronouns,
    profilePhoto,
    email,
    slack,
    phone,
    avaliability,
  });
}
