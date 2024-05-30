const net = require("net");
const fs = require("fs");

console.log("Logs from your program will appear here!");

const validGETPaths = ["", "echo", "user-agent", "files"];
const validPOSTPaths = ["files"];

const HTTP_OK = "HTTP/1.1 200 OK\r\n";
const HTTP_CREATED = "HTTP/1.1 201 Created\r\n\r\n";
const HTTP_NOT_FOUND = "HTTP/1.1 404 Not Found\r\n\r\n";
const HTTP_SERVER_ERROR = "HTTP/1.1 500 Internal Server Error\r\n\r\n";

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

    if (
      (request === "GET" && validGETPaths.includes(path[1])) ||
      (request === "POST" && validPOSTPaths.includes(path[1]))
    ) {
      socket.write(buildResponse(path, parts, request));
    } else {
      socket.write(HTTP_NOT_FOUND);
    }
  });
});

server.listen(serverPort, serverHost);

function buildResponse(path, parts, type) {
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

      if (type === "GET") {
        try {
          body = fs.readFileSync(file_path, "utf8").toString();
          responseHeaders = "Content-Type: application/octet-stream\r\n";
          status = HTTP_OK;
        } catch (error) {
          status = HTTP_NOT_FOUND;
        }
      }
      if (type === "POST") {
        parts_text = parts.join(" ");
        let body_seperator = parts_text.indexOf("\r\n\r\n") + 4;
        let bodyContent = parts_text.substring(body_seperator);

        try {
          fs.writeFileSync(file_path, bodyContent);
          status = HTTP_CREATED;
        } catch (error) {
          status = HTTP_SERVER_ERROR;
        }
      }
      break;

    default:
      body = "";
      status = HTTP_OK;
      break;
  }

  return `${status}${responseHeaders}Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
}
