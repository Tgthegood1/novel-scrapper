let { webnovel } = require("./src/index.js")

webnovel("https://www.webnovel.com/book/pieces-of-the-past_32168295508965905/new-world_86374925098613666", "C:\Users\Tgthegood\Documents\Novels").then(() => {
  console.log("Descarga completada");
}).catch(err => {
  console.error("Error:", err);
});