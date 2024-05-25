const net = require("net");
const fs = require("fs");

console.log("Logs from your program will appear here!");

const validPaths = ["", "echo", "user-agent", "files"];
const HTTP_OK = "HTTP/1.1 200 OK\r\n";
const HTTP_NOT_FOUND = "HTTP/1.1 404 Not Found\r\n\r\n";
const serverPort = 4221;
const serverHost = "localhost";

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const parts = String(data).split(" ");
    const request = parts[0];
    const path = parts[1].split("/");

    socket.on("close", () => {
      socket.end();
    });

    if (request === "GET" && validPaths.includes(path[1])) {
      socket.write(buildResponse(path, parts));
    } else {
      socket.write(HTTP_NOT_FOUND);
    }
  });
});

server.listen(serverPort, serverHost);

function buildResponse(path, parts) {
  let body = "";
  let responseHeaders = "Content-Type: text/plain\r\n";
  let status = HTTP_NOT_FOUND;

  switch (path[1]) {
    case "echo":
      body = path.length > 2 ? path[2] : ""; // handling potential undefined path[2]
      status = HTTP_OK;
      break;
    case "user-agent":
      body = parts[parts.length - 1].split("\r\n")[0]; // assuming this is the user-agent part
      status = HTTP_OK;
      break;
    case "files":
      requested_file = path.length > 2 ? path[2] : "";
      const directory = process.argv[3];
      file_path = directory + "/" + requested_file;
      console.log("File path:" + file_path);

      try {
        body = fs.readFileSync(file_path, "utf8").toString();
        responseHeaders = "Content-Type: application/octet-stream\r\n";
        status = HTTP_OK;
      } catch (error) {
        status = HTTP_NOT_FOUND;
      }
      break;

    default:
      body = "";
      status = HTTP_OK;
      break;
  }

  return `${status}${responseHeaders}Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
}
