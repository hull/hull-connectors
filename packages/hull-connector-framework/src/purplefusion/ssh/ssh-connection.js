const ssh2_1 = require("ssh2");
const net = require("net");
const fs = require("fs");
const os = require("os");
const path = require("path");

class SSHConnection {
  constructor(options) {
    this.options = options;
    this.connections = [];
    if (!options.username) {
      this.options.username = process.env["SSH_USERNAME"] || process.env["USER"];
    }
    if (!options.endPort) {
      this.options.endPort = 22;
    }
    if (!options.privateKey) {
      this.options.privateKey = fs.readFileSync(`${os.homedir()}${path.sep}.ssh${path.sep}id_rsa`);
    }
  }
  async shutdown() {
    for (const connection of this.connections) {
      connection.removeAllListeners();
      connection.end();
    }
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(resolve);
      }
      return resolve();
    });
  }

  async connect(host, stream) {
    const connection = new ssh2_1.Client();
    return new Promise(async (resolve, reject) => {
      try {
        const options = {
          host,
          username: this.options.username,
          privateKey: this.options.privateKey,
          port: this.options.endPort
        };
        /*
        if (this.options.agentForward) {
          options["agentForward"] = true;
          // guaranteed to give the ssh agent sock if the agent is running
          const agentSock = process.env["SSH_AUTH_SOCK"];
          if (agentSock === undefined) {
            throw new Error("SSH Agent is not running and not set in the SSH_AUTH_SOCK env variable");
          }
          options["agent"] = agentSock;
        }
        if (stream) {
          options["sock"] = stream;
        }
        if (options.privateKey && options.privateKey.toString()
          .toLowerCase()
          .includes("encrypted")) {
          options["passphrase"] = (this.options.passphrase) ? this.options.passphrase : await this.getPassphrase();
        }
        */
        connection.connect(options);
        connection.on("error", (error) => {
          return reject(error);
        });
        connection.on("ready", () => {
          this.connections.push(connection);
          return resolve(connection);
        });
      } catch (connectionError) {
        reject(connectionError);
      }
    });
  }
  async forward(options) {
    const connection = await this.connect(this.options.endHost);
    return new Promise((resolve, reject) => {
      try {
        this.server = net.createServer((socket) => {
          connection.forwardOut("localhost", options.fromPort, options.toHost || "localhost", options.toPort, (error, stream) => {
            if (error) {
              socket.end("Could not connect to destination host");
              return;
            }
            socket.pipe(stream);
            stream.pipe(socket);
          });
        })
          .listen(options.fromPort, "localhost", () => {
            return resolve();
          });
      } catch (error) {
        reject(error);
      }
    });
  }
}
exports.SSHConnection = SSHConnection;
