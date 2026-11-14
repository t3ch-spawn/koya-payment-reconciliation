const fs = require("fs");


// Getting the payment info in form of lines from the payments.jsonl file
const latest = new Map();
const lines = fs.readFileSync("payments.jsonl", "utf8").split(/\r?\n/);

// Looping through the extracted lines
for (const line of lines) {
  if (!line.trim()) continue;

  let event;

  //   Try-catch safety block for handling unreadable lines
  try {
    event = JSON.parse(line);
  } catch {
    continue;
  }

  if (event?.txn_id == null || event.txn_id === "") continue;

  // Attempts can appear out of order in the export.
  const previous = latest.get(event.txn_id);
  if (!previous || Date.parse(event.ts) > Date.parse(previous.ts)) {
    latest.set(event.txn_id, event);
  }
}


// Initialise paymentCount and totalKobo variables
let paymentCount = 0;
let totalKobo = 0;


for (const event of latest.values()) {
  if (event.status !== "success") continue;

  // Amounts can be numbers or strings such as "4,804.15", so convert them to Numbers totally
  const amount = Number(String(event.amount).replace(/,/g, ""));
  totalKobo += Math.round(amount * 100);
  paymentCount += 1;
}

// Store expected count in the expectedCount variable
const expectedCount = parseInt(
  fs.readFileSync("expected.txt", "utf8").trim(),
  10,
);



if (paymentCount !== expectedCount) {
  console.log(
    `Check failed: counted ${paymentCount} successful payments, expected ${expectedCount}.`,
  );
  console.log(
    "Something in the data isn't being handled the way the README describes.",
  );
} else {
  console.log(`Check passed: ${paymentCount} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(totalKobo / 100)}`);
}
