const net = require("net");
const fs = require("fs");

console.log("Logs from your program will appear here!");

const validGETPaths = ["", "echo", "user-agent", "files"];
const validPOSTPaths = ["files"];

const validEncoding = ["gzip"];

const HTTP_OK = "HTTP/1.1 200 OK\r\n";
const HTTP_CREATED = "HTTP/1.1 201 Created\r\n\r\n";
const HTTP_NOT_FOUND = "HTTP/1.1 404 Not Found\r\n\r\n";
const HTTP_SERVER_ERROR = "HTTP/1.1 500 Internal Server Error\r\n\r\n";

const serverPort = 4221;
const serverHost = "localhost";

function getHeader(headers, headerName) {
  const header = headers.find((header) => header.startsWith(headerName + ":"));
  return header ? header.split(": ")[1].trim() : null;
}

const server = net.createServer((socket) => {
  socket.on("close", () => {
    socket.end();
  });

  socket.on("data", (data) => {
    const { requestType, path, headers, body } = parseRequest(data);

    if (
      (requestType === "GET" && validGETPaths.includes(path[0])) ||
      (requestType === "POST" && validPOSTPaths.includes(path[0]))
    ) {
      socket.write(buildResponse(path, body, requestType, headers));
    } else {
      socket.write(HTTP_NOT_FOUND);
    }
  });
});

server.listen(serverPort, serverHost);

function parseRequest(data) {
  const text = data.toString();
  const [headerPart, body] = text.split("\r\n\r\n");
  const headers = headerPart.split("\r\n");
  const [requestType, fullPath] = headers.shift().split(" ");
  const path = fullPath.split("/").slice(1);
  return { requestType, path, headers, body };
}

function buildResponse(path, requestBody, type, headers) {
  let body = "";
  let responseHeaders = "Content-Type: text/plain\r\n";
  let status = HTTP_NOT_FOUND;

  if (validEncoding.includes(getHeader(headers, "Accept-Encoding"))) {
    responseHeaders += `Content-Encoding: ${getHeader(headers, "Accept-Encoding")}\r\n`;
  }

  switch (path[0]) {
    case "":
      status = HTTP_OK;
      break;
    case "echo":
      body = path[1] || "";
      status = HTTP_OK;
      break;
    case "user-agent":
      const userAgent = getHeader(headers, "User-Agent") || "";
      body = userAgent;
      status = HTTP_OK;
      break;
    case "files":
      const directory = process.argv[3];
      const file_path = `${directory}/${path[1] || ""}`;

      if (type === "GET") {
        try {
          body = fs.readFileSync(file_path, "utf8").toString();
          responseHeaders = "Content-Type: application/octet-stream\r\n";
          status = HTTP_OK;
        } catch (error) {
          status = HTTP_NOT_FOUND;
        }
      } else if (type === "POST") {
        try {
          fs.writeFileSync(file_path, requestBody);
          status = HTTP_CREATED;
        } catch (error) {
          status = HTTP_SERVER_ERROR;
        }
      }
      break;
    default:
      status = HTTP_NOT_FOUND;
      break;
  }

  return `${status}${responseHeaders}Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
}
