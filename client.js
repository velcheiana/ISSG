const io = require("socket.io-client");
const readline = require("readline");
const crypto = require("crypto");

const socket = io("http://localhost:3000");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> "
});

let username = "";

// Function to create a hash for message verification
function createHash(message) {
    const hash = crypto.createHash("sha256");
    hash.update(message);
    return hash.digest("hex");
}

socket.on("connect", () => {
    console.log("Connected to the server");

    rl.question("Enter your username: ", (input) => {
        username = input;
        console.log(`Welcome, ${username} to the chat`);
        rl.prompt();

        rl.on("line", (message) => {
            if (message.trim()) {
                const hash = createHash(message);
                socket.emit("message", { username, message, hash });
            }
            rl.prompt();
        });
    });
});

socket.on("message", (data) => {
    const { username: senderUsername, message: senderMessage, hash: receivedHash } = data;

    // Verify message integrity
    const expectedHash = createHash(senderMessage);
    const isTampered = receivedHash !== expectedHash;

    if (senderUsername != username) {
        console.log(`${senderUsername}: ${senderMessage}`);
        if (isTampered) {
            console.log(`Warning: Message from ${senderUsername} may have been tampered with.`);
        }
        rl.prompt();
    }
});

socket.on("disconnect", () => {
    console.log("Server disconnected, Exiting...");
    rl.close();
    process.exit(0);
});

rl.on("SIGINT", () => {
    console.log("\nExiting...");
    socket.disconnect();
    rl.close();
    process.exit(0);
});