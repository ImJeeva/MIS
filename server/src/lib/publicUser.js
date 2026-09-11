// Strips sensitive fields before sending a user to the client.
export function publicUser(u) {
  if (!u) return null;
  const { passwordHash, ...safe } = u;
  return safe;
}
