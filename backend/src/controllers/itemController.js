const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const Item = require("../models/Item");
const BorrowRequest = require("../models/BorrowRequest");
const {
  validateCreateItemInput,
  validateUpdateItemInput,
  validateListItemsQuery
} = require("../validation/itemValidation");

function buildItemResponse(item) {
  const data = item.toObject ? item.toObject() : { ...item };
  return data;
}

const createItem = asyncHandler(async (req, res, next) => {
  const { errors, value } = validateCreateItemInput(req.body);
  if (errors.length > 0) {
    return next(new AppError(errors.join(", "), 400));
  }

  const item = await Item.create({
    owner_id: req.user._id,
    title: value.title,
    description: value.description,
    category: value.category,
    condition: value.condition,
    address: value.address,
    location: value.location,
    image_urls: value.image_urls
  });

  const populatedItem = await Item.findById(item._id).populate("owner_id", "name email rating_avg rating_count");

  return sendSuccess(
    res,
    {
      item: buildItemResponse(populatedItem)
    },
    { statusCode: 201 }
  );
});

const listItems = asyncHandler(async (req, res, next) => {
  const { errors, value } = validateListItemsQuery(req.query);
  if (errors.length > 0) {
    return next(new AppError(errors.join(", "), 400));
  }

  const filter = {};
  if (value.category) filter.category = value.category;
  if (value.owner_id) filter.owner_id = value.owner_id;
  if (value.is_available !== undefined) filter.is_available = value.is_available;
  if (value.search) {
    filter.$or = [
      { title: { $regex: value.search, $options: "i" } },
      { description: { $regex: value.search, $options: "i" } },
      { category: { $regex: value.search, $options: "i" } }
    ];
  }

  const skip = (value.page - 1) * value.limit;

  const [items, total] = await Promise.all([
    Item.find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(value.limit)
      .populate("owner_id", "name email rating_avg rating_count"),
    Item.countDocuments(filter)
  ]);

  return sendSuccess(res, {
    items: items.map(buildItemResponse),
    meta: {
      page: value.page,
      limit: value.limit,
      total,
      totalPages: Math.ceil(total / value.limit)
    }
  });
});

const getItemById = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.itemId)) {
    return next(new AppError("Item not found", 404));
  }

  const item = await Item.findById(req.params.itemId).populate("owner_id", "name email rating_avg rating_count");
  if (!item) {
    return next(new AppError("Item not found", 404));
  }

  return sendSuccess(res, {
    item: buildItemResponse(item)
  });
});

function canManageItem(item, user) {
  if (!item || !user) return false;
  if (user.role === "admin") return true;
  return item.owner_id.toString() === user._id.toString();
}

const updateItem = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.itemId)) {
    return next(new AppError("Item not found", 404));
  }

  const { errors, value } = validateUpdateItemInput(req.body);
  if (errors.length > 0) {
    return next(new AppError(errors.join(", "), 400));
  }

  const item = await Item.findById(req.params.itemId);
  if (!item) {
    return next(new AppError("Item not found", 404));
  }

  if (!canManageItem(item, req.user)) {
    return next(new AppError("You do not have permission to update this item", 403));
  }

  Object.entries(value).forEach(([key, updateValue]) => {
    item[key] = updateValue;
  });

  await item.save();

  const updatedItem = await Item.findById(item._id).populate("owner_id", "name email rating_avg rating_count");
  return sendSuccess(res, {
    item: buildItemResponse(updatedItem)
  });
});

const deleteItem = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.itemId)) {
    return next(new AppError("Item not found", 404));
  }

  const item = await Item.findById(req.params.itemId);
  if (!item) {
    return next(new AppError("Item not found", 404));
  }

  if (!canManageItem(item, req.user)) {
    return next(new AppError("You do not have permission to delete this item", 403));
  }

  const linkedRequestCount = await BorrowRequest.countDocuments({ item_id: item._id });
  if (linkedRequestCount > 0) {
    return next(
      new AppError(
        "Cannot delete this item because it is linked to existing borrow requests",
        409
      )
    );
  }

  await item.deleteOne();

  return sendSuccess(res, {
    message: "Item deleted successfully"
  });
});

module.exports = {
  createItem,
  listItems,
  getItemById,
  updateItem,
  deleteItem
};