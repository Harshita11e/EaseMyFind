import User from '../models/User.model.js';
import Item from '../models/Item.model.js';
import Claim from '../models/Claim.model.js';
import Notification from '../models/Notification.model.js';

// @GET /api/admin/stats — Dashboard stats
export const getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalItems,
      lostItems,
      foundItems,
      claimedItems,
      resolvedItems,
      totalClaims,
      flaggedItems
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Item.countDocuments(),
      Item.countDocuments({ status: 'lost' }),
      Item.countDocuments({ status: 'found' }),
      Item.countDocuments({ status: 'claimed' }),
      Item.countDocuments({ status: 'resolved' }),
      Claim.countDocuments(),
      Item.countDocuments({ isFlagged: true })
    ]);

    const successRate = totalItems > 0
      ? ((resolvedItems / totalItems) * 100).toFixed(1)
      : 0;

    res.status(200).json({
      totalUsers,
      totalItems,
      lostItems,
      foundItems,
      claimedItems,
      resolvedItems,
      totalClaims,
      flaggedItems,
      successRate
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @GET /api/admin/users — Get all users
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    let query = { role: 'user' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      users,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @PATCH /api/admin/users/:id/block — Block/Unblock user
export const toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: "Can't block an admin" });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.status(200).json({
      message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`,
      isBlocked: user.isBlocked
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @DELETE /api/admin/users/:id — Delete user
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: "Can't delete an admin" });
    }

    // Delete all items and claims by this user
    await Item.deleteMany({ postedBy: user._id });
    await Claim.deleteMany({ claimedBy: user._id });
    await Notification.deleteMany({ recipient: user._id });
    await user.deleteOne();

    res.status(200).json({ message: 'User and all associated data deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @GET /api/admin/items — Get all items
export const getAllItems = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, flagged } = req.query;

    let query = {};
    if (status) query.status = status;
    if (flagged === 'true') query.isFlagged = true;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [items, total] = await Promise.all([
      Item.find(query)
        .populate('postedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
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

// @PATCH /api/admin/items/:id/flag — Flag/Unflag item
export const toggleFlagItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    item.isFlagged = !item.isFlagged;
    await item.save();

    res.status(200).json({
      message: `Item ${item.isFlagged ? 'flagged' : 'unflagged'} successfully`,
      isFlagged: item.isFlagged
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @DELETE /api/admin/items/:id — Delete any item
export const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Delete associated claims
    await Claim.deleteMany({ item: item._id });
    await Notification.deleteMany({ relatedItem: item._id });
    await item.deleteOne();

    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @GET /api/admin/claims — Get all claims
export const getAllClaims = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    let query = {};
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [claims, total] = await Promise.all([
      Claim.find(query)
        .populate('claimedBy', 'name email')
        .populate('item', 'title status category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Claim.countDocuments(query)
    ]);

    res.status(200).json({
      claims,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @GET /api/admin/notifications — Get all notifications
export const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate('recipient', 'name email')
      .populate('relatedItem', 'title')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};