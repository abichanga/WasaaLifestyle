//populate the database with sample providers from the research CSV,
//plus real reviews (with tags) and photos so the app looks fully populated
require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const Provider = require("./models/Provider");
const ServiceCategory = require("./models/ServiceCategory");
const Booking = require("./models/Booking");
const Review = require("./models/Review");

const SAMPLE_SIZE = 50;
const CATEGORIES = ["Plumbing", "Electrical", "Carpentry", "Appliance Repair"];
const AREAS = ["Westlands", "Kilimani", "Lavington", "Karen", "Kileleshwa", "Roysambu", "Kasarani", "Embakasi", "South B", "Langata", "Parklands", "Donholm"];

const FIRST = ["John","Mary","Peter","Grace","David","Faith","James","Ann","Paul","Ruth","Samuel","Joyce"];
const LAST = ["Kamau","Otieno","Mwangi","Wanjiku","Ochieng","Njeri","Kiptoo","Achieng","Mutua","Chebet"];

// feedback chips, split so we can match them to the rating
const POSITIVE_TAGS = ["On time", "Professional", "Quality work", "Fair price", "Clean & tidy", "Would rebook"];
const NEGATIVE_TAGS = ["Arrived late", "Poor workmanship", "Overpriced", "Unprofessional", "Didn't finish", "No-show"];

// short comments to vary the reviews (some reviews will have none)
const POSITIVE_COMMENTS = [
  "Great work, very reliable.",
  "Showed up on time and did a clean job.",
  "Highly recommend, will book again.",
  "Professional and friendly.",
  "Fixed the problem quickly.",
  "",  // some reviews are tags-only, no comment
  "",
];
const NEGATIVE_COMMENTS = [
  "Came late and rushed the job.",
  "Not what I expected for the price.",
  "Had to call them back to finish.",
  "",
  "",
];

function randomName(i) {
  const f = FIRST[i % FIRST.length];
  const l = LAST[Math.floor(i / FIRST.length) % LAST.length];
  return { fullName: `${f} ${l}`, email: `provider${i}@example.com` };
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// pick 1-3 distinct tags from a list
function pickTags(list, max) {
  const n = 1 + Math.floor(Math.random() * max);
  const shuffled = [...list].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  //1. wipe old seeded data so re-running doesn't duplicate
  await Review.deleteMany({});
  await Booking.deleteMany({});
  await Provider.deleteMany({});
  await User.deleteMany({ role: "provider" });
  await User.deleteMany({ email: "demo.household@example.com" });
  console.log("Cleared existing seeded data");

  //2. ensure categories exist
  const categoryIds = [];
  for (const name of CATEGORIES) {
    let cat = await ServiceCategory.findOne({ name });
    if (!cat) cat = await ServiceCategory.create({ name });
    categoryIds.push(cat._id);
  }
  console.log("Categories ready");

  //3. create one demo household to own the seeded bookings/reviews
  const hashedPw = await bcrypt.hash("password123", 10);
  const household = await User.create({
    fullName: "Demo Household",
    email: "demo.household@example.com",
    phone: "0700000000",
    password: hashedPw,
    role: "household",
  });

  //4. read the CSV
  const csvPath = path.join(__dirname, "..", "model", "simulated_providers.csv");
  const raw = fs.readFileSync(csvPath, "utf-8");
  const rows = parse(raw, {
    columns: true,
    delimiter: ["\t", ","],
    skip_empty_lines: true,
  }).slice(0, SAMPLE_SIZE);

  //5. create a user + provider for each row, with real reviews
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

    const provider = await Provider.create({
      userId: user._id,
      bio: `${fullName} - experienced service provider in Nairobi.`,
      serviceCategoryId: categoryIds[i % categoryIds.length],
      verificationTier: r.verification_tier.toLowerCase(),
      identityVerified: r.verification_tier.toLowerCase() !== "provisional",
      completionRate: parseFloat(r.completion_rate),
      confirmedJobCount: parseInt(r.confirmed_job_count),
      area: AREAS[Math.floor(Math.random() * AREAS.length)],
      photo: `/avatars/${(i % 15) + 1}.png`,  // curated local avatars 
    });

    //6. generate real reviews consistent with this provider's CSV rating
    const targetReviews = Math.min(parseInt(r.review_count) || 0, 8); // cap at 8 for a tidy demo
    const targetAvg = parseFloat(r.avg_rating) || 4;

    for (let j = 0; j < targetReviews; j++) {
      // ratings cluster around the provider's target average, with a little spread
      let rating = Math.round(targetAvg + (Math.random() * 1.4 - 0.7));
      if (rating > 5) rating = 5;
      if (rating < 1) rating = 1;

      const positive = rating >= 4;
      const tags = pickTags(positive ? POSITIVE_TAGS : NEGATIVE_TAGS, positive ? 3 : 2);
      const comment = pick(positive ? POSITIVE_COMMENTS : NEGATIVE_COMMENTS);

      // a completed booking behind each review (keeps data honest)
      const booking = await Booking.create({
        householdId: household._id,
        providerId: provider._id,
        status: "completed",
        scheduledDate: "2026-10-15",
        scheduledTime: "10:00",
        address: `${provider.area}, Nairobi`,
        notes: "Seeded completed job.",
      });

      await Review.create({
        bookingId: booking._id,
        providerId: provider._id,
        rating,
        comment,
        tags,
      });
    }

    //7. recompute this provider's signals FROM the real reviews
    const reviews = await Review.find({ providerId: provider._id });
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, rv) => acc + rv.rating, 0);
      provider.avgRating = Math.round((sum / reviews.length) * 10) / 10;
      provider.reviewCount = reviews.length;
      const complaints = reviews.filter((rv) => {
        const low = rv.rating <= 2;
        const negTag = (rv.tags || []).some((t) => NEGATIVE_TAGS.includes(t));
        return low || negTag;
      }).length;
      provider.complaintRate = Math.round((complaints / reviews.length) * 100) / 100;
    } else {
      provider.avgRating = 0;
      provider.reviewCount = 0;
      provider.complaintRate = parseFloat(r.complaint_rate) || 0;
    }
    await provider.save();
  }

  console.log(`Seeded ${rows.length} providers with real reviews, photos, and bookings`);
  console.log(`Demo household login: demo.household@example.com / password123`);
  await mongoose.disconnect();
  console.log("Done. Now run: node runScoring.js");
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  mongoose.disconnect();
});