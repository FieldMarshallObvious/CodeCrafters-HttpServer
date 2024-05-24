const net = require("net");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

valid_paths = ["/"];

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    parts = String(data).split(" ");
    request = parts[0];
    path = parts[1];
    if (request == "GET" && valid_paths.includes(path)) {
      httpResponse = "HTTP/1.1 200 OK\r\n\r\n";
      socket.write(httpResponse);
    } else {
      const httpResponse = "HTTP/1.1 404 Not Found\r\n\r\n";
      socket.write(httpResponse);
    }
  });
  socket.on("close", () => {
    socket.end();
    server.close();
  });
});

server.listen(4221, "localhost");
