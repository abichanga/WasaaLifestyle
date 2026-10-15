//one-off: score all providers currently in the database
require("dotenv").config();
const mongoose = require("mongoose");
const { scoreAll } = require("./services/scoreProviders");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected. Scoring all providers...");
  const count = await scoreAll();
  console.log(`Scored ${count} providers.`);
  await mongoose.disconnect();
  console.log("Done.");
}

run().catch((err) => {
  console.error("Scoring failed:", err.message);
  mongoose.disconnect();
});