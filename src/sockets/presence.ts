
const online_users = new Map<string, Set<string>>();

export const add_user = (user_id: string, socket_id: string): boolean => {
  if (!online_users.has(user_id)) {
    online_users.set(user_id, new Set());
  }

  const user_sockets = online_users.get(user_id)!;
  const is_first_connection = user_sockets.size === 0;
  user_sockets.add(socket_id);

  return is_first_connection;
};

export const remove_user = (user_id: string, socket_id: string): boolean => {
  if (!online_users.has(user_id)) {
    return false;
  }

  const user_sockets = online_users.get(user_id)!;
  user_sockets.delete(socket_id);

  if (user_sockets.size === 0) {
    online_users.delete(user_id);
    return true;
  }

  return false;
};

export const is_user_online = (user_id: string): boolean =>
  online_users.has(user_id);

export const get_user_socket_ids = (user_id: string): Set<string> | undefined =>
  online_users.get(user_id);