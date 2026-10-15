//Computes and saves trust scores for providers in the database
const Provider = require("../models/Provider");
const { computeTrustScore } = require("./trustScore");

//score a single provider and save it
async function scoreOne(provider) {
  const result = computeTrustScore(provider);
  provider.trustScore = {
    value: result.value,
    lastComputed: new Date(),
  };
  await provider.save();
  return result;
}

//Score every provider in the database 
async function scoreAll() {
  const providers = await Provider.find();
  for (const provider of providers) {
    await scoreOne(provider);
  }
  return providers.length;
}

module.exports = { scoreOne, scoreAll };