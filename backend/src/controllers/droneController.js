import Drone from "../models/Drone.js";

/**
 * GET /api/drones
 */
export async function getDrones(req, res, next) {
  try {
    let drones = await Drone.find();
    if (drones.length === 0) {
      // Seed sample active drones
      drones = await Drone.insertMany([
        {
          droneId: "DRONE-01",
          name: "DumpSentry Alpha (DJI Matrice 300)",
          status: "IN_MISSION",
          batteryLevel: 84,
          altitudeMeters: 45,
          currentLatitude: 22.5354,
          currentLongitude: 88.3616,
          lastHeartbeat: new Date(),
        },
        {
          droneId: "DRONE-02",
          name: "DumpSentry Beta (Autel EVO II)",
          status: "IDLE",
          batteryLevel: 98,
          altitudeMeters: 0,
          currentLatitude: 22.5726,
          currentLongitude: 88.3639,
          lastHeartbeat: new Date(),
        },
      ]);
    }
    res.json(drones);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/drones/telemetry
 */
export async function updateTelemetry(req, res, next) {
  try {
    const { droneId, latitude, longitude, altitude, batteryLevel, status } = req.body;
    if (!droneId) {
      return res.status(400).json({ error: "droneId is required" });
    }

    const drone = await Drone.findOneAndUpdate(
      { droneId },
      {
        ...(latitude && { currentLatitude: latitude }),
        ...(longitude && { currentLongitude: longitude }),
        ...(altitude !== undefined && { altitudeMeters: altitude }),
        ...(batteryLevel !== undefined && { batteryLevel }),
        ...(status && { status }),
        lastHeartbeat: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json(drone);
  } catch (err) {
    next(err);
  }
}
