import { detectEnvironmentalContext } from "./services/geospatial.js";
import { evaluateRules } from "./services/ruleEngine.js";
import mongoose from "mongoose";
import { seedInitialData } from "./services/seed.js";

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/dumpsentry");
  await seedInitialData();

  const points = [
    { name: "Hooghly River Point", lat: 22.5855, lon: 88.3435 },
    { name: "Victoria Memorial Grounds", lat: 22.5448, lon: 88.3426 },
    { name: "Presidency University", lat: 22.5750, lon: 88.3620 },
    { name: "Calcutta Medical College", lat: 22.5726, lon: 88.3639 },
    { name: "Howrah Railway Platform", lat: 22.5830, lon: 88.3428 },
    { name: "High Court / Civic Building", lat: 22.5691, lon: 88.3433 },
  ];

  for (const pt of points) {
    const geo = await detectEnvironmentalContext(pt.lat, pt.lon, 250);
    const ruleEval = await evaluateRules(geo.nearbyPlaces, geo.contextType, geo);
    console.log(
      `${pt.name.padEnd(30)} -> Detected: ${geo.contextType.padEnd(23)} Authority: ${ruleEval.authority?.name} (${ruleEval.authority?.type}) Email: ${ruleEval.authority?.email}`
    );
  }

  await mongoose.disconnect();
}

main().catch(console.error);
