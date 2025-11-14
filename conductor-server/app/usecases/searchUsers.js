import { User } from '../../domain/entities/User.js';

/**
 *
 * @param {*} param0
 * @returns
 */
export function makeSearchUsers({ classQueryRepo /* implements port */ }) {
  return async function searchUsers({ filter = '', limit = 50 } = {}) {
    const rows = await classQueryRepo.search({ filter, limit });
    // ensure domain entity integrity
    return rows.map((r) => User({ id: r.id, className: r.class_name, userName: r.user_name }));
  };
}
