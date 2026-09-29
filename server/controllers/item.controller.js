import Item from '../models/Item.model.js';
import Notification from '../models/Notification.model.js';
import Claim from '../models/Claim.model.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

// @POST /api/items — Create item
export const createItem = async (req, res) => {
  try {
    // In createItem — replace the destructuring
    const {
      title, description, category, status,
      location, dateLostOrFound
    } = req.body;

    // Secret details — parse from body
    const secretDetails = {
      primary: req.body['secretDetails.primary'] || req.body.secretDetails?.primary || '',
      secondary: req.body['secretDetails.secondary'] || req.body.secretDetails?.secondary || '',
      tertiary: req.body['secretDetails.tertiary'] || req.body.secretDetails?.tertiary || ''
    };

    // ✅ At least primary secret is required
    if (!secretDetails.primary || secretDetails.primary.trim().length < 5) {
      return res.status(400).json({
        message: 'Primary secret detail is required (at least 5 characters)'
      });
    }

    // ✅ FIX 14: Limit items per user (max 50 active items)
    const activeItemsCount = await Item.countDocuments({
      postedBy: req.user._id,
      status: { $ne: 'resolved' }
    });

    if (activeItemsCount >= 50) {
      return res.status(400).json({
        message: 'You have reached the maximum limit of 50 active listings'
      });
    }

    // ✅ FIX 15: Validate date is not in the future
    const itemDate = new Date(dateLostOrFound);
    if (itemDate > new Date()) {
      return res.status(400).json({ message: 'Date cannot be in the future' });
    }

    // Upload images to cloudinary
    let images = [];
    if (req.files && req.files.length > 0) {
      // ✅ FIX 16: Max 5 images
      const filesToUpload = req.files.slice(0, 5);
      const uploadPromises = filesToUpload.map(file => uploadToCloudinary(file.buffer));
      const results = await Promise.all(uploadPromises);
      images = results.map(result => result.secure_url);
    }

    let parsedLocation;
    try {
      parsedLocation = JSON.parse(location);
    } catch {
      return res.status(400).json({ message: 'Invalid location format' });
    }

    const item = await Item.create({
      title: title.trim(),
      description: description.trim(),
      secretDetails: secretDetails.trim(),
      category,
      status,
      images,
      location: parsedLocation,
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
      page = 1, sort = 'newest'
    } = req.query;

    const limit = Math.min(parseInt(req.query.limit) || 12, 50);
    const currentPage = Math.max(parseInt(page), 1);
    const skip = (currentPage - 1) * limit;

    // ✅ Use Atlas fuzzy search if search term provided
    if (search && search.trim().length > 0) {
      try {
        const searchQuery = search.trim().substring(0, 100);

        // Build match filter
        const matchFilter = { isFlagged: false };
        if (category) matchFilter.category = category;
        if (status) matchFilter.status = status;

        const pipeline = [
          {
            $search: {
              index: 'items_search',
              compound: {
                should: [
                  {
                    // Fuzzy match on title — handles typos
                    text: {
                      query: searchQuery,
                      path: 'title',
                      fuzzy: {
                        maxEdits: 1,
                        prefixLength: 2
                      },
                      score: { boost: { value: 3 } }
                    }
                  },
                  {
                    // Fuzzy match on description
                    text: {
                      query: searchQuery,
                      path: 'description',
                      fuzzy: {
                        maxEdits: 1,
                        prefixLength: 2
                      }
                    }
                  },
                  {
                    // Phrase match — exact phrase gets higher score
                    phrase: {
                      query: searchQuery,
                      path: ['title', 'description'],
                      score: { boost: { value: 5 } }
                    }
                  }
                ],
                minimumShouldMatch: 1
              }
            }
          },
          { $match: matchFilter },
          {
            $facet: {
              items: [
                { $sort: { score: { $meta: 'searchScore' }, createdAt: -1 } },
                { $skip: skip },
                { $limit: limit },
                {
                  $lookup: {
                    from: 'users',
                    localField: 'postedBy',
                    foreignField: '_id',
                    as: 'postedBy',
                    pipeline: [{ $project: { name: 1, avatar: 1 } }]
                  }
                },
                { $unwind: '$postedBy' },
                { $project: { secretDetails: 0 } }
              ],
              total: [{ $count: 'count' }]
            }
          }
        ];

        const [result] = await Item.aggregate(pipeline);
        const items = result.items || [];
        const total = result.total[0]?.count || 0;

        return res.status(200).json({
          items,
          total,
          pages: Math.ceil(total / limit),
          currentPage
        });
      } catch (atlasError) {
        // ✅ Fallback to regular text search if Atlas Search fails
        console.log('Atlas Search failed, falling back to text search:', atlasError.message);
      }
    }

    // ✅ Regular query (no search term or Atlas fallback)
    let query = { isFlagged: false };
    if (category) query.category = category;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.dateLostOrFound = {};
      if (startDate) query.dateLostOrFound.$gte = new Date(startDate);
      if (endDate) query.dateLostOrFound.$lte = new Date(endDate);
    }

    if (lat && lng && radius) {
      const radiusInDeg = Math.min(parseFloat(radius), 100) / 111;
      query['location.lat'] = {
        $gte: parseFloat(lat) - radiusInDeg,
        $lte: parseFloat(lat) + radiusInDeg
      };
      query['location.lng'] = {
        $gte: parseFloat(lng) - radiusInDeg,
        $lte: parseFloat(lng) + radiusInDeg
      };
    }

    let sortOption = {};
    if (sort === 'newest') sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'date') sortOption = { dateLostOrFound: -1 };

    const [items, total] = await Promise.all([
      Item.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .populate('postedBy', 'name avatar')
        .select('-secretDetails'),
      Item.countDocuments(query)
    ]);

    res.status(200).json({
      items,
      total,
      pages: Math.ceil(total / limit),
      currentPage
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

    const isOwner = req.user &&
      item.postedBy._id.toString() === req.user._id.toString();

    const itemData = item.toObject();

    // ✅ FIX 19: Hide secret details from non-owners always

    if (!isOwner) {
      delete itemData.secretDetails;
    } else {
      // Owner sees all secret details
      itemData.secretDetails = item.secretDetails;
    }

    // ✅ FIX 20: Hide contact info unless claim is accepted
    if (!isOwner) {
      delete itemData.postedBy.phone;
      delete itemData.postedBy.email;
    }

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

    if (item.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // ✅ FIX 21: Cannot edit resolved items
    if (item.status === 'resolved') {
      return res.status(400).json({ message: 'Cannot edit a resolved item' });
    }

    const updates = { ...req.body };
    if (updates.location) {
      try {
        updates.location = JSON.parse(updates.location);
      } catch {
        return res.status(400).json({ message: 'Invalid location format' });
      }
    }

    if (req.files?.length > 0) {
      const uploadPromises = req.files.slice(0, 5).map(file => uploadToCloudinary(file.buffer));
      const results = await Promise.all(uploadPromises);
      updates.images = results.map(result => result.secure_url);
    }

    // ✅ FIX 22: Cannot change status manually to resolved/claimed
    if (updates.status && ['resolved', 'claimed'].includes(updates.status)) {
      delete updates.status;
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
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

    if (
      item.postedBy.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // ✅ FIX 23: Delete associated claims and notifications
    await Claim.deleteMany({ item: item._id });
    await Notification.deleteMany({ relatedItem: item._id });
    await item.deleteOne();

    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @GET /api/items/user/my-items
export const getMyItems = async (req, res) => {
  try {
    const items = await Item.find({ postedBy: req.user._id })
      .sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @GET /api/items/map
export const getMapItems = async (req, res) => {
  try {
    const items = await Item.find({ isFlagged: false })
      .select('title status location images category')
      .sort({ createdAt: -1 })
      .limit(500);
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @PATCH /api/items/:id/resolve
export const resolveItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // ✅ FIX 24: Already resolved check
    if (item.status === 'resolved') {
      return res.status(400).json({ message: 'Item is already resolved' });
    }

    item.status = 'resolved';
    await item.save();

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

// @GET /api/items/suggestions
export const getSearchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.status(200).json([]);

    // ✅ FIX 25: Sanitize and limit search query
    const sanitized = q.substring(0, 50).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const items = await Item.find({
      title: { $regex: sanitized, $options: 'i' },
      isFlagged: false
    })
      .select('title category status')
      .limit(6);

    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};