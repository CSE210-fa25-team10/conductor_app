/**
 * @typedef {Object} ClassQueryPort
 * @property {(params: { filter?: string, limit?: number }) => Promise<Array>} search
 */
export const ClassQueryPort = Symbol('ClassQueryPort'); // token for DI