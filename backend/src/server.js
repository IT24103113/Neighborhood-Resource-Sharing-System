require("dotenv").config();
const http = require("http");
const app = require("./app");   

const PORT = process.env.PORT || 5000;

async function startServer() {


    const server = http.createServer(app);
    
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Nearshare API listening on port ${PORT}`);
    });
}

if(require.main === module) {
    startServer();
}

module.exports = { app, startServer };