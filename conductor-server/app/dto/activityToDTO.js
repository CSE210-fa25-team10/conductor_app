/**
 * 
 * @param {*} entity 
 * @returns 
 */
export function activityToDTO(entity) {
  return {
    ClassName: entity.className,
    'user.name': entity.userName,
  };
}