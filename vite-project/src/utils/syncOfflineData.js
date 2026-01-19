
import { ref, push, update } from "firebase/database";
import { db } from "../firebase";
import { getOfflineQueue, clearOfflineQueue } from "./offlineQueue";

export async function syncOfflineData() {
  const queue = getOfflineQueue();
  if (!queue.length) return;

  for (const action of queue) {
    if (action.type === "SALE") {
      await push(ref(db, "sales"), action.payload);
    }

    if (action.type === "UPDATE_STOCK") {
      await update(ref(db, `products/${action.productId}`), {
        stock: action.stock,
      });
    }
  }

  clearOfflineQueue();
}
