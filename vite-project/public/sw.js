self.addEventListener("install", () => {
  console.log("Service Worker installed");
});

self.addEventListener("fetch", (event) => {
  if (event.request.url.includes("firebasestorage.googleapis.com")) {
    return;
  }

  event.respondWith(fetch(event.request));
});
