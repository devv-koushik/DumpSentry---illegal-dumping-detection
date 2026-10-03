import Detection from "../models/Detection.js";

/**
 * GET /api/dashboard/overview
 * Returns key statistics for top cards
 */
export async function getOverviewStats(req, res, next) {
  try {
    const [total, suspectedIllegal, pendingReview, resolved] = await Promise.all([
      Detection.countDocuments(),
      Detection.countDocuments({ status: "Suspected Illegal" }),
      Detection.countDocuments({ status: "Pending Review" }),
      Detection.countDocuments({ status: "Resolved" }),
    ]);

    res.json({
      total,
      suspectedIllegal,
      pendingReview,
      resolved,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/dashboard/analytics
 * Returns aggregated statistics for charts
 */
export async function getAnalytics(req, res, next) {
  try {
    const totalDetections = await Detection.countDocuments();

    if (totalDetections === 0) {
      return res.json({
        trend: [],
        categoryData: [],
        contextDistribution: [],
        statusDistribution: [],
      });
    }

    // 1. Category Breakdown
    const categoryAgg = await Detection.aggregate([
      { $unwind: "$wasteTypes" },
      { $group: { _id: "$wasteTypes", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    // 2. Context Breakdown
    const contextAgg = await Detection.aggregate([
      { $group: { _id: "$context", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);

    // 3. Status Breakdown
    const statusAgg = await Detection.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // 4. Trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trendAgg = await Detection.aggregate([
      { $match: { timestamp: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const trend = trendAgg.map((t) => ({
      day: days[new Date(t._id).getDay()],
      detections: t.count,
    }));

    res.json({
      trend,
      categoryData: categoryAgg.map((c) => ({
        name: capitalize(c._id.replace(/_/g, " ")),
        value: c.count,
      })),
      contextDistribution: contextAgg.map((c) => ({
        name: c._id || "Other",
        value: c.count,
      })),
      statusDistribution: statusAgg.map((s) => ({
        name: s._id,
        value: s.count,
      })),
    });
  } catch (err) {
    next(err);
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
