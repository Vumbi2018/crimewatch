if (typeof global.FormData === "undefined") {
  global.FormData = require("react-native/Libraries/Network/FormData").default;
}

if (typeof global.queueMicrotask === "undefined") {
  global.queueMicrotask = (fn) => Promise.resolve().then(fn);
}
