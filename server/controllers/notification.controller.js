import Notification from '../models/Notification.model.js';

// @GET /api/notifications — Get user notifications
export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id
    })
      .populate('relatedItem', 'title images')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @PATCH /api/notifications/read-all — Mark all as read
export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @PATCH /api/notifications/:id/read — Mark single as read
export const markOneRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true }
    );

    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};