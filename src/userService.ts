export async function findUser(connection: any, identifier: string) {
  let results: any;
  if (/^\d+$/.test(identifier)) {
    [results] = await connection.execute(
      "SELECT * FROM User WHERE id = ? LIMIT 1;",
      [identifier]
    );
  } else {
    [results] = await connection.execute(
      "SELECT * FROM User WHERE username = ? LIMIT 1;",
      [identifier]
    );
  }
  if (results.length === 0) {
    return null;
  }
  return results[0];
}