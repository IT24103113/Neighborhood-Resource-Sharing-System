const Review = require("../models/Review");
const User = require("../models/User");

async function refreshUserRating(userId) {
  const result = await Review.aggregate([
    {
      $match: {
        reviewee_id: userId
      }
    },
    {
      $group: {
        _id: "$reviewee_id",
        rating_avg: { $avg: "$rating" },
        rating_count: { $sum: 1 }
      }
    }
  ]);

  if (result.length === 0) {
    await User.findByIdAndUpdate(userId, {
      rating_avg: 0,
      rating_count: 0
    });
    return;
  }

  const summary = result[0];
  const rounded = Number(summary.rating_avg.toFixed(2));
  await User.findByIdAndUpdate(userId, {
    rating_avg: rounded,
    rating_count: summary.rating_count
  });
}

module.exports = {
  refreshUserRating
};