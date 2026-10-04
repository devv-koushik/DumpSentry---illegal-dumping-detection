import Ward from "../models/Ward.js";

/**
 * Get all wards
 * GET /api/wards
 */
export async function getWards(req, res, next) {
  try {
    const wards = await Ward.find().sort({ wardNumber: 1 });
    res.json(wards);
  } catch (err) {
    next(err);
  }
}

/**
 * Update a ward
 * PUT /api/wards/:id
 */
export async function updateWard(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await Ward.findOneAndUpdate({ id }, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ error: "Ward not found" });
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
}
