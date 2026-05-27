// sw.js - This file needs to be in the root of the directory to work,
//         so do not move it next to the other scripts

const CACHE_NAME = "lab-8-starter-v1";

// Files to pre-cache (app shell)
const APP_SHELL = [
  "/",
  "/index.html",
  "/assets/styles/main.css",
  "/assets/scripts/main.js",
  "/assets/scripts/RecipeCard.js",
  "/assets/images/icons/icon-192x192.png",
  "/assets/images/icons/0-star.svg",
  "/assets/images/icons/1-star.svg",
  "/assets/images/icons/2-star.svg",
  "/assets/images/icons/3-star.svg",
  "/assets/images/icons/4-star.svg",
  "/assets/images/icons/5-star.svg",
];

// Recipe JSON files (local paths)
const RECIPE_JSON = [
  "/recipes/1_50-thanksgiving-side-dishes.json",
  "/recipes/2_roasting-turkey-breast-with-stuffing.json",
  "/recipes/3_moms-cornbread-stuffing.json",
  "/recipes/4_50-indulgent-thanksgiving-side-dishes-for-any-holiday-gathering.json",
  "/recipes/5_healthy-thanksgiving-recipe-crockpot-turkey-breast.json",
  "/recipes/6_one-pot-thanksgiving-dinner.json",
];

// Installs the service worker. Feed it some initial URLs to cache
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      // B6. Add app shell and recipe JSON files to cache
      return cache.addAll(APP_SHELL.concat(RECIPE_JSON));
    }),
  );
});

// Activates the service worker and removes old caches
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Intercept fetch requests and cache them (cache-first strategy)
self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise, fetch from network and cache the response for future
      return caches.open(CACHE_NAME).then((cache) => {
        return fetch(event.request)
          .then((response) => {
            // Only cache valid responses (status 200 and basic or cors)
            if (
              !response ||
              response.status !== 200 ||
              response.type === "opaque"
            ) {
              // Still return the response even if we don't cache it
              return response;
            }
            // Clone response because response streams can only be read once
            const responseClone = response.clone();
            cache.put(event.request, responseClone);
            return response;
          })
          .catch(() => {
            // If both cache and network fail, you could return a fallback page or asset
            // For images, you might return a placeholder icon
            if (event.request.destination === "image") {
              return caches.match("/assets/images/icons/icon-192x192.png");
            }
            return new Response("Offline", {
              status: 503,
              statusText: "Offline",
            });
          });
      });
    }),
  );
});
