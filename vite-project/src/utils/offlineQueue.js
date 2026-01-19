export function queueOfflineAction(action) {
  const queue = JSON.parse(localStorage.getItem("offlineQueue")) || [];
  queue.push(action);
  localStorage.setItem("offlineQueue", JSON.stringify(queue));
}

export function getOfflineQueue() {
  return JSON.parse(localStorage.getItem("offlineQueue")) || [];
}

export function clearOfflineQueue() {
  localStorage.removeItem("offlineQueue");
}
