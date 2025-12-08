/**
 *
 * @param {*} param0
 * @returns
 */
export function makeLoginUser({ userRepo, passwordHasher }) {
  return async function login({ email, password }) {
    const user = await userRepo.findByEmail(email);
    if (!user) return null;

    const ok = await passwordHasher.compare(password, user.password_hash);
    if (!ok) return null;

    // only return what the app needs
    return { id: user.id, role: user.role };
  };
}
