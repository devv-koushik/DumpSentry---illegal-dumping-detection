import Authority from "../models/Authority.js";

export async function getAuthorities(req, res, next) {
  try {
    const filter = {};
    if (req.query.zone) {
      filter.zone = req.query.zone;
    }
    if (req.query.borough) {
      filter.borough = req.query.borough;
    }
    if (req.query.type) {
      filter.type = req.query.type;
    }

    const authorities = await Authority.find(filter).sort({ wardNumber: 1, name: 1 });
    res.json(authorities);
  } catch (err) {
    next(err);
  }
}

export async function createAuthority(req, res, next) {
  try {
    const authority = new Authority(req.body);
    await authority.save();
    res.status(201).json(authority);
  } catch (err) {
    next(err);
  }
}

export async function updateAuthority(req, res, next) {
  try {
    const { id } = req.params;
    const authority = await Authority.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!authority) {
      return res.status(404).json({ error: "Authority not found" });
    }
    res.json(authority);
  } catch (err) {
    next(err);
  }
}

export async function deleteAuthority(req, res, next) {
  try {
    const { id } = req.params;
    const result = await Authority.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ error: "Authority not found" });
    }
    res.json({ message: "Authority deleted successfully" });
  } catch (err) {
    next(err);
  }
}
