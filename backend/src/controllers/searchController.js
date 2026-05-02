const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const { sendSuccess } = require("../utils/apiResponse");
const Item = require("../models/Item");
const User = require("../models/User");

function parseNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const searchItems = asyncHandler(async (req, res, next) => {
  const q = (req.query.q || "").toString().trim();
  const category = (req.query.category || "").toString().trim().toLowerCase();
  const distanceKm = parseNumber(req.query.distance_km);
  const lng = parseNumber(req.query.lng);
  const lat = parseNumber(req.query.lat);

  if ((distanceKm !== null || lng !== null || lat !== null) && [distanceKm, lng, lat].includes(null)) {
    return next(new AppError("distance_km, lng and lat must be provided together", 400));
  }

  const baseFilter = { is_available: true };
  if (category) baseFilter.category = category;
  if (q) {
    baseFilter.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { category: { $regex: q, $options: "i" } }
    ];
  }

  if (distanceKm !== null) {
    const maxDistanceMeters = distanceKm * 1000;
    const items = await Item.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [lng, lat]
          },
          distanceField: "distance_meters",
          maxDistance: maxDistanceMeters,
          spherical: true,
          query: baseFilter
        }
      },
      { $sort: { distance_meters: 1, created_at: -1 } },
      { $limit: 100 }
    ]);

    return sendSuccess(res, {
      items,
      meta: {
        count: items.length,
        mode: "geo"
      }
    });
  }

  const items = await Item.find(baseFilter)
    .sort({ created_at: -1 })
    .limit(100)
    .populate("owner_id", "name email rating_avg rating_count role");

  return sendSuccess(res, {
    items,
    meta: {
      count: items.length,
      mode: "text"
    }
  });
});

const searchUsers = asyncHandler(async (req, res) => {
  const q = (req.query.q || "").toString().trim();
  const role = (req.query.role || "").toString().trim().toLowerCase();

  const filter = { role: { $ne: "admin" } };
  if (role) filter.role = role;
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { address: { $regex: q, $options: "i" } }
    ];
  }

  const users = await User.find(filter)
    .select("name email role rating_avg rating_count address avatar_url")
    .sort({ created_at: -1 })
    .limit(100);

  return sendSuccess(res, {
    users,
    meta: {
      count: users.length
    }
  });
});

module.exports = {
  searchItems,
  searchUsers
};