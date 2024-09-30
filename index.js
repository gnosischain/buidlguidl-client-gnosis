import { execSync, spawn } from "child_process";
import os from "os";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { initializeMonitoring } from "./monitor.js";
import {
  installMacLinuxConsensusClient,
  installMacLinuxExecutionClient,
  installWindowsConsensusClient,
  installWindowsExecutionClient,
} from "./ethereum_client_scripts/install.js";
import { initializeHttpConnection } from "./https_connection/httpsConnection.js";
import {
  executionClient,
  consensusClient,
  executionPeerPort,
  consensusPeerPorts,
  consensusCheckpoint,
  installDir,
  saveOptionsToFile,
  deleteOptionsFile,
} from "./commandLineOptions.js";
import {
  fetchBGExecutionPeers,
  configureBGExecutionPeers,
  fetchBGConsensusPeers,
  configureBGConsensusPeers,
} from "./ethereum_client_scripts/configureBGPeers.js";
import axios from "axios";
import { debugToFile } from "./helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const gethVer = "1.14.3";
const rethVer = "1.0.0";
const prysmVer = "5.1.0";
const lighthouseVer = "5.2.0";

const lockFilePath = path.join(installDir, "ethereum_clients", "script.lock");

// const CONFIG = {
//   debugLogPath: path.join(installDir, "ethereum_clients", "debugIndex.log"),
// };

function createJwtSecret(jwtDir) {
  if (!fs.existsSync(jwtDir)) {
    console.log(`\nCreating '${jwtDir}'`);
    fs.mkdirSync(jwtDir, { recursive: true });
  }

  if (!fs.existsSync(`${jwtDir}/jwt.hex`)) {
    console.log("Generating JWT.hex file.");
    execSync(`cd "${jwtDir}" && openssl rand -hex 32 > jwt.hex`, {
      stdio: "inherit",
    });
  }
}

let executionChild;
let consensusChild;

let executionExited = false;
let consensusExited = false;

function handleExit() {
  console.log("\n\n🛰️  Received exit signal\n");

  deleteOptionsFile();
  debugToFile(`handleExit(): deleteOptionsFile() has been called`);

  try {
    // Check if both child processes have exited
    const checkExit = () => {
      if (executionExited && consensusExited) {
        console.log("\n👍 Both clients exited!");
        removeLockFile();
        process.exit(0);
      }
    };

    // Handle execution client exit
    const handleExecutionExit = (code) => {
      if (!executionExited) {
        executionExited = true;
        console.log(`🫡 Execution client exited with code ${code}`);
        checkExit();
      }
    };

    // Handle consensus client exit
    const handleConsensusExit = (code) => {
      if (!consensusExited) {
        consensusExited = true;
        console.log(`🫡 Consensus client exited with code ${code}`);
        checkExit();
      }
    };

    // Handle execution client close
    const handleExecutionClose = (code) => {
      if (!executionExited) {
        executionExited = true;
        console.log(`🫡 Execution client closed with code ${code}`);
        checkExit();
      }
    };

    // Handle consensus client close
    const handleConsensusClose = (code) => {
      if (!consensusExited) {
        consensusExited = true;
        console.log(`🫡 Consensus client closed with code ${code}`);
        checkExit();
      }
    };

    // Ensure event listeners are set before killing the processes
    if (executionChild && !executionExited) {
      executionChild.on("exit", handleExecutionExit);
      executionChild.on("close", handleExecutionClose);
    } else {
      executionExited = true;
    }

    if (consensusChild && !consensusExited) {
      consensusChild.on("exit", handleConsensusExit);
      consensusChild.on("close", handleConsensusClose);
    } else {
      consensusExited = true;
    }

    // Send the kill signals after setting the event listeners
    if (executionChild && !executionExited) {
      console.log("⌛️ Exiting execution client...");
      setTimeout(() => {
        executionChild.kill("SIGINT");
      }, 750);
    }

    if (consensusChild && !consensusExited) {
      console.log("⌛️ Exiting consensus client...");
      setTimeout(() => {
        consensusChild.kill("SIGINT");
      }, 750);
    }

    // Initial check in case both children are already not running
    checkExit();

    // Periodically check if both child processes have exited
    const intervalId = setInterval(() => {
      checkExit();
      // Clear interval if both clients have exited
      if (executionExited && consensusExited) {
        clearInterval(intervalId);
      }
    }, 1000);
  } catch (error) {
    console.log("Error from handleExit()", error);
  }
}

process.on("SIGINT", handleExit);
/// SIGTERM for using kill command to shut down process
process.on("SIGTERM", handleExit);

process.on("SIGUSR2", () => {
  handleExit();
});

let bgConsensusPeers = [];
let bgConsensusAddrs;

async function startClient(clientName, installDir) {
  let clientCommand,
    clientArgs = [];

  if (clientName === "geth") {
    clientArgs.push("--executionpeerport", executionPeerPort);
    clientCommand = path.join(__dirname, "ethereum_client_scripts/geth.js");
  } else if (clientName === "reth") {
    clientArgs.push("--executionpeerport", executionPeerPort);
    clientCommand = path.join(__dirname, "ethereum_client_scripts/reth.js");
  } else if (clientName === "prysm") {
    bgConsensusPeers = await fetchBGConsensusPeers();
    bgConsensusAddrs = await configureBGConsensusPeers(consensusClient);

    if (bgConsensusPeers.length > 0) {
      clientArgs.push("--bgconsensuspeers", bgConsensusPeers);
    }

    if (bgConsensusAddrs != null) {
      clientArgs.push("--bgconsensusaddrs", bgConsensusAddrs);
    }

    if (consensusCheckpoint != null) {
      clientArgs.push("--consensuscheckpoint", consensusCheckpoint);
    }

    clientArgs.push("--consensuspeerports", consensusPeerPorts);

    clientCommand = path.join(__dirname, "ethereum_client_scripts/prysm.js");
  } else if (clientName === "lighthouse") {
    bgConsensusPeers = await fetchBGConsensusPeers();
    bgConsensusAddrs = await configureBGConsensusPeers(consensusClient);

    if (bgConsensusPeers.length > 0) {
      clientArgs.push("--bgconsensuspeers", bgConsensusPeers);
    }

    if (bgConsensusAddrs != null) {
      clientArgs.push("--bgconsensusaddrs", bgConsensusAddrs);
    }

    if (consensusCheckpoint != null) {
      clientArgs.push("--consensuscheckpoint", consensusCheckpoint);
    }
    clientArgs.push("--consensuspeerports", consensusPeerPorts);

    clientCommand = path.join(
      __dirname,
      "ethereum_client_scripts/lighthouse.js"
    );
  } else {
    clientCommand = path.join(
      installDir,
      "ethereum_clients",
      clientName,
      clientName
    );
  }

  clientArgs.push("--directory", installDir);

  const child = spawn("node", [clientCommand, ...clientArgs], {
    stdio: ["inherit", "pipe", "inherit"],
    cwd: process.env.HOME,
    env: { ...process.env, INSTALL_DIR: installDir },
  });

  if (clientName === "geth") {
    executionChild = child;
  } else if (clientName === "reth") {
    executionChild = child;
  } else if (clientName === "prysm") {
    consensusChild = child;
  } else if (clientName === "lighthouse") {
    consensusChild = child;
  }

  child.on("exit", (code) => {
    console.log(`🫡 ${clientName} process exited with code ${code}`);
    if (clientName === "geth" || clientName === "reth") {
      executionExited = true;
    } else if (clientName === "prysm" || clientName === "lighthouse") {
      consensusExited = true;
    }
  });

  child.on("error", (err) => {
    console.log(`Error from start client: ${err.message}`);
  });

  console.log(clientName, "started");

  child.stdout.on("error", (err) => {
    console.error(`Error on stdout of ${clientName}: ${err.message}`);
  });
}

function isAlreadyRunning() {
  try {
    if (fs.existsSync(lockFilePath)) {
      const pid = fs.readFileSync(lockFilePath, "utf8");
      try {
        process.kill(pid, 0);
        return true;
      } catch (e) {
        if (e.code === "ESRCH") {
          fs.unlinkSync(lockFilePath);
          return false;
        }
        throw e;
      }
    }
    return false;
  } catch (err) {
    console.error("Error checking for existing process:", err);
    return false;
  }
}

function createLockFile() {
  fs.writeFileSync(lockFilePath, process.pid.toString(), "utf8");
  // console.log(process.pid.toString())
}

function removeLockFile() {
  if (fs.existsSync(lockFilePath)) {
    fs.unlinkSync(lockFilePath);
  }
}

const jwtDir = path.join(installDir, "ethereum_clients", "jwt");
const platform = os.platform();

if (["darwin", "linux"].includes(platform)) {
  installMacLinuxExecutionClient(executionClient, platform, gethVer, rethVer);
  installMacLinuxConsensusClient(consensusClient, platform, lighthouseVer);
} else if (platform === "win32") {
  installWindowsExecutionClient(executionClient);
  installWindowsConsensusClient(consensusClient);
}

let messageForHeader = "";
let runsClient = false;

createJwtSecret(jwtDir);

const httpConfig = {
  executionClient: executionClient,
  consensusClient: consensusClient,
  gethVer: gethVer,
  rethVer: rethVer,
  prysmVer: prysmVer,
  lighthouseVer: lighthouseVer,
};

if (!isAlreadyRunning()) {
  deleteOptionsFile();

  await startClient(executionClient, installDir);
  await startClient(consensusClient, installDir);

  initializeHttpConnection(httpConfig);

  runsClient = true;
  createLockFile();
  saveOptionsToFile();
} else {
  messageForHeader = "Dashboard View (client already running)";
  runsClient = false;
}

initializeMonitoring(
  messageForHeader,
  executionClient,
  consensusClient,
  gethVer,
  rethVer,
  prysmVer,
  lighthouseVer,
  runsClient
);

let bgExecutionPeers = [];

setTimeout(async () => {
  bgExecutionPeers = await fetchBGExecutionPeers();
  await configureBGExecutionPeers(bgExecutionPeers);
}, 10000);

import { WebSocket } from "ws";
// Create a WebSocket connection
let socket;
let socketId;

function createWebSocketConnection() {
  socket = new WebSocket("wss://stage.rpc.buidlguidl.com:48544");

  // Connection opened
  socket.on("open", () => {
    // debugToFile(`Connected to WebSocket server. ID: ${JSON.stringify(socket)}`);
  });

  // Listen for messages from the server
  socket.on("message", async (data) => {
    const response = JSON.parse(data);
    // debugToFile(`Received response from server: ${JSON.stringify({ data })}`);

    if (!socketId || socketId === null) {
      socketId = response.id;
      debugToFile(`Socket ID: ${socketId}`);
    } else {
      const targetUrl = "http://localhost:8545";

      try {
        const rpcResponse = await axios.post(targetUrl, {
          jsonrpc: "2.0",
          method: "eth_blockNumber",
          params: [],
          id: 1,
        });
        debugToFile(`Current Block Number: ${JSON.stringify({ rpcResponse })}`);

        // Send the response back to the WebSocket server
        socket.send(JSON.stringify(rpcResponse.data));
      } catch (error) {
        debugToFile("Error fetching block number:", JSON.stringify({ error }));

        // Send an error response back to the WebSocket server
        socket.send(
          JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32603,
              message: "Internal error",
              data: error.message,
            },
            id: 1,
          })
        );
      }
    }
  });

  // Connection closed
  socket.on("close", () => {
    socketId = null;
    debugToFile("Disconnected from WebSocket server");
  });

  // Error handling
  socket.on("error", (error) => {
    debugToFile("WebSocket error:", error);
  });
}

createWebSocketConnection();

// Check WebSocket connection every 30 seconds
setInterval(() => {
  if (socket.readyState === WebSocket.CLOSED) {
    socketId = null;
    debugToFile("WebSocket disconnected. Attempting to reconnect...");
    createWebSocketConnection();
  }
}, 15000);

function getSocketId() {
  return socketId;
}

export { bgExecutionPeers, bgConsensusPeers, getSocketId };
