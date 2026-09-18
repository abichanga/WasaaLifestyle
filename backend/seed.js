//populate the database with sample providers from the research CSV
require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const Provider = require("./models/Provider");
const ServiceCategory = require("./models/ServiceCategory");

const SAMPLE_SIZE = 50;
const CATEGORIES = ["Plumbing", "Cleaning", "Electrical"];

//generate a simple fake name/email for each provider 
const FIRST = ["John","Mary","Peter","Grace","David","Faith","James","Ann","Paul","Ruth","Samuel","Joyce"];
const LAST = ["Kamau","Otieno","Mwangi","Wanjiku","Ochieng","Njeri","Kiptoo","Achieng","Mutua","Chebet"];

function randomName(i) {
  const f = FIRST[i % FIRST.length];
  const l = LAST[Math.floor(i / FIRST.length) % LAST.length];
  return { fullName: `${f} ${l}`, email: `provider${i}@example.com` };
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  //1. wipe old seeded providers so re-running doesn't duplicate
  await Provider.deleteMany({});
  await User.deleteMany({ role: "provider" });
  console.log("Cleared existing providers");

  //2. ensure categories exist, collect their ids
  const categoryIds = [];
  for (const name of CATEGORIES) {
    let cat = await ServiceCategory.findOne({ name });
    if (!cat) cat = await ServiceCategory.create({ name });
    categoryIds.push(cat._id);
  }
  console.log("Categories ready");

  //3. read the CSV
  const csvPath = path.join(__dirname, "..", "model", "simulated_providers.csv");
  const raw = fs.readFileSync(csvPath, "utf-8");
  const rows = parse(raw, {
    columns: true,
    delimiter: ["\t", ","],   //handle tab OR comma separated
    skip_empty_lines: true,
  }).slice(0, SAMPLE_SIZE);

  //4. create a user + provider for each row
  const hashedPw = await bcrypt.hash("password123", 10);

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const { fullName, email } = randomName(i);

    const user = await User.create({
      fullName,
      email,
      phone: "07" + String(10000000 + i),
      password: hashedPw,
      role: "provider",
    });

    await Provider.create({
      userId: user._id,
      bio: `${fullName} - experienced service provider in Nairobi.`,
      serviceCategoryId: categoryIds[i % categoryIds.length],
      verificationTier: r.verification_tier.toLowerCase(),
      identityVerified: r.verification_tier.toLowerCase() !== "provisional",
      avgRating: parseFloat(r.avg_rating),
      completionRate: parseFloat(r.completion_rate),
      complaintRate: parseFloat(r.complaint_rate),
      confirmedJobCount: parseInt(r.confirmed_job_count),
      reviewCount: parseInt(r.review_count),
    });
  }

  console.log(`Seeded ${rows.length} providers`);
  await mongoose.disconnect();
  console.log("Done");
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  mongoose.disconnect();
});