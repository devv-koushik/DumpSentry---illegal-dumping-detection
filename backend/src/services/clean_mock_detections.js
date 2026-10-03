import { connectDB } from "../config/db.js";
import Detection from "../models/Detection.js";
import Alert from "../models/Alert.js";

async function main() {
  await connectDB();

  // Find all mock detections: those pointing to picsum or external urls or with non-YOLO classes
  const allDetections = await Detection.find().lean();
  const mockDetections = allDetections.filter(
    (d) =>
      (d.originalImageUrl && d.originalImageUrl.includes("picsum")) ||
      (d.originalImageUrl && !d.originalImageUrl.startsWith("/uploads")) ||
      (Array.isArray(d.wasteTypes) &&
        d.wasteTypes.some((w) =>
          ["biomedical_waste", "food_waste", "other", "plastic"].includes(w)
        ))
  );

  const realDetections = allDetections.filter(
    (d) => d.originalImageUrl && d.originalImageUrl.startsWith("/uploads")
  );

  console.log(`Total detections in DB: ${allDetections.length}`);
  console.log(`Mock detections found: ${mockDetections.length}`);
  console.log(`Real uploaded detections to preserve: ${realDetections.length}`);

  const mockIds = mockDetections.map((d) => d._id);

  if (mockIds.length > 0) {
    // Also clean any alerts referencing mock detections
    const alertResult = await Alert.deleteMany({ detectionId: { $in: mockIds } });
    console.log(`Deleted ${alertResult.deletedCount} alerts linked to mock detections.`);

    // Delete the mock detections
    const detResult = await Detection.deleteMany({ _id: { $in: mockIds } });
    console.log(`Deleted ${detResult.deletedCount} mock detections from MongoDB.`);
  }

  const remaining = await Detection.find().lean();
  console.log(`\nRemaining REAL detections in MongoDB: ${remaining.length}`);
  remaining.forEach((d) => {
    console.log(` - ID: ${d.detectionId} | waste: ${JSON.stringify(d.wasteTypes)} | img: ${d.originalImageUrl}`);
  });

  process.exit(0);
}

main().catch((err) => {
  console.error("Error cleaning mock detections:", err);
  process.exit(1);
});
