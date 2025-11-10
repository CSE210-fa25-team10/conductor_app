/**
 * 
 * @param {*} entity 
 * @returns 
 */
export function courseToDTO(entity) {
  return {
    ClassName: entity.className,
    'user.name': entity.userName,
  };
}