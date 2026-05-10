import Item from '../models/Item.model.js';
import Notification from '../models/Notification.model.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

// @POST /api/items — Create item
export const createItem = async (req, res) => {
  try {
    const {
      title, description, secretDetails,
      category, status, location,
      dateLostOrFound
    } = req.body;

    // Upload images to cloudinary
    let images = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer));
      const results = await Promise.all(uploadPromises);
      images = results.map(result => result.secure_url);
    }

    const item = await Item.create({
      title,
      description,
      secretDetails,
      category,
      status,
      images,
      location: JSON.parse(location),
      dateLostOrFound,
      postedBy: req.user._id
    });

    res.status(201).json({ message: 'Item posted successfully', item });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @GET /api/items — Get all items with search & filters
export const getItems = async (req, res) => {
  try {
    const {
      search, category, status,
      startDate, endDate,
      lat, lng, radius,
      page = 1, limit = 12,
      sort = 'newest'
    } = req.query;

    let query = { isFlagged: false };

    // Full text search
    if (search) {
      query.$text = { $search: search };
    }

    // Category filter
    if (category) query.category = category;

    // Status filter
    if (status) query.status = status;

    // Date range filter
    if (startDate || endDate) {
      query.dateLostOrFound = {};
      if (startDate) query.dateLostOrFound.$gte = new Date(startDate);
      if (endDate) query.dateLostOrFound.$lte = new Date(endDate);
    }

    // Location radius filter
    if (lat && lng && radius) {
      query['location.lat'] = {
        $gte: parseFloat(lat) - parseFloat(radius) / 111,
        $lte: parseFloat(lat) + parseFloat(radius) / 111
      };
      query['location.lng'] = {
        $gte: parseFloat(lng) - parseFloat(radius) / 111,
        $lte: parseFloat(lng) + parseFloat(radius) / 111
      };
    }

    // Sort
    let sortOption = {};
    if (sort === 'newest') sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'date') sortOption = { dateLostOrFound: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [items, total] = await Promise.all([
      Item.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('postedBy', 'name avatar'),
      Item.countDocuments(query)
    ]);

    res.status(200).json({
      items,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @GET /api/items/:id — Get single item
export const getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('postedBy', 'name avatar email phone');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Hide secret details from non-owners
    const isOwner = req.user &&
      item.postedBy._id.toString() === req.user._id.toString();

    const itemData = item.toObject();
    if (!isOwner) delete itemData.secretDetails;

    res.status(200).json(itemData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @PUT /api/items/:id — Update item
export const updateItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Only owner can update
    if (item.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updates = req.body;
    if (updates.location) updates.location = JSON.parse(updates.location);

    // Upload new images if provided
    if (req.files?.length > 0) {
      const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer));
      const results = await Promise.all(uploadPromises);
      updates.images = results.map(result => result.secure_url);
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    res.status(200).json({ message: 'Item updated', item: updatedItem });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @DELETE /api/items/:id — Delete item
export const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Only owner or admin can delete
    if (
      item.postedBy.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await item.deleteOne();
    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @GET /api/items/user/my-items — Get logged in user's items
export const getMyItems = async (req, res) => {
  try {
    const items = await Item.find({ postedBy: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @GET /api/items/map — Get all items for map view
export const getMapItems = async (req, res) => {
  try {
    const items = await Item.find({ isFlagged: false })
      .select('title status location images category')
      .sort({ createdAt: -1 });

    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @PATCH /api/items/:id/resolve — Mark item as resolved
export const resolveItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    item.status = 'resolved';
    await item.save();

    // Notify poster
    await Notification.create({
      recipient: req.user._id,
      message: `Your item "${item.title}" has been marked as resolved! 🎉`,
      type: 'item_resolved',
      relatedItem: item._id
    });

    res.status(200).json({ message: 'Item marked as resolved', item });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @GET /api/items/suggestions — Autocomplete search
export const getSearchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(200).json([]);

    const items = await Item.find({
      title: { $regex: q, $options: 'i' },
      isFlagged: false
    })
      .select('title category status')
      .limit(6);

    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};