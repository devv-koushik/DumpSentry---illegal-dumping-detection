import Rule from "../models/Rule.js";

export async function getRules(req, res, next) {
  try {
    const rules = await Rule.find().sort({ priority: 1 });
    res.json(rules);
  } catch (err) {
    next(err);
  }
}

export async function createRule(req, res, next) {
  try {
    const rule = new Rule(req.body);
    await rule.save();
    res.status(201).json(rule);
  } catch (err) {
    next(err);
  }
}

export async function updateRule(req, res, next) {
  try {
    const { id } = req.params;
    const rule = await Rule.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!rule) {
      return res.status(404).json({ error: "Rule not found" });
    }
    res.json(rule);
  } catch (err) {
    next(err);
  }
}

export async function deleteRule(req, res, next) {
  try {
    const { id } = req.params;
    const result = await Rule.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ error: "Rule not found" });
    }
    res.json({ message: "Rule deleted successfully" });
  } catch (err) {
    next(err);
  }
}
