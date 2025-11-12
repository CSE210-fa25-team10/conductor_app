/**
 * userToDTO transfers the intermediate User class to a JSON Data-Transfer-Object.
 * This is useful for returning users as JSON objects to the frontend.
 * @param {*} User 
 * @returns JSON object representing User.
 */
export function userToDTO(User) {
  return {
    'user.id' : User.id, 
    'user.name' : User.name, 
    'user.pronounciation' : User.pronunciation, 
    'user.pronouns' : User.pronouns, 
    'user.profilePhoto' : User.profilePhoto, 
    'user.email' : User.email, 
    'user.slack' : User.slack, 
    'user.phone' : User.phone, 
    'user.avaliability' : User.avaliability
  };
}