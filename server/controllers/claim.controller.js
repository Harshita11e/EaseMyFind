import Claim from '../models/Claim.model.js';
import Item from '../models/Item.model.js';
import Notification from '../models/Notification.model.js';
import User from '../models/User.model.js';
import { sendEmail } from '../utils/sendEmail.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

// @POST /api/claims/:itemId — Submit a claim
export const submitClaim = async (req, res) => {
  try {
    const { proofDescription } = req.body;
    const itemId = req.params.itemId;

    const item = await Item.findById(itemId).populate('postedBy');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Can't claim your own item
    if (item.postedBy._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You can't claim your own item" });
    }

    // Can't claim already resolved item
    if (item.status === 'resolved') {
      return res.status(400).json({ message: 'Item is already resolved' });
    }

    // Check if already claimed by this user
    const existingClaim = await Claim.findOne({
      item: itemId,
      claimedBy: req.user._id
    });

    if (existingClaim) {
      return res.status(400).json({ message: 'You already submitted a claim for this item' });
    }

    // Get proof image if uploaded
    let proofImage = '';
if (req.file) {
  const result = await uploadToCloudinary(req.file.buffer);
  proofImage = result.secure_url;
}

    // Create claim
    const claim = await Claim.create({
      item: itemId,
      claimedBy: req.user._id,
      proofDescription,
      proofImage
    });

    // Update item status to claimed
    item.status = 'claimed';
    await item.save();

    // Notify item poster
    await Notification.create({
      recipient: item.postedBy._id,
      message: `Someone claimed your item "${item.title}" — review their claim!`,
      type: 'new_claim',
      relatedItem: item._id
    });

    // Email item poster
    await sendEmail({
      to: item.postedBy.email,
      subject: `New Claim on your item — ${item.title}`,
      html: `
        <h2>Hi ${item.postedBy.name},</h2>
        <p>Someone has submitted a claim on your item <strong>${item.title}</strong>.</p>
        <p>Login to EaseMyFind to review the claim and accept or reject it.</p>
        <br/>
        <p>— Team EaseMyFind</p>
      `
    });

    res.status(201).json({ message: 'Claim submitted successfully', claim });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @GET /api/claims/item/:itemId — Get all claims for an item (owner only)
export const getClaimsForItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.itemId);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Only item owner can see claims
    if (item.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const claims = await Claim.find({ item: req.params.itemId })
      .populate('claimedBy', 'name email phone avatar')
      .sort({ createdAt: -1 });

    res.status(200).json(claims);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @GET /api/claims/my-claims — Get logged in user's claims
export const getMyClaims = async (req, res) => {
  try {
    const claims = await Claim.find({ claimedBy: req.user._id })
      .populate('item', 'title images status category')
      .sort({ createdAt: -1 });

    res.status(200).json(claims);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @PATCH /api/claims/:claimId/accept — Accept a claim
export const acceptClaim = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.claimId)
      .populate('claimedBy')
      .populate('item');

    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    const item = await Item.findById(claim.item._id)
      .populate('postedBy');

    // Only item owner can accept
    if (item.postedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update claim status
    claim.status = 'accepted';
    claim.reviewedBy = req.user._id;
    await claim.save();

    // Update item status to resolved
    item.status = 'resolved';
    await item.save();

    // Reject all other pending claims for this item
    await Claim.updateMany(
      {
        item: item._id,
        _id: { $ne: claim._id },
        status: 'pending'
      },
      { status: 'rejected' }
    );

    // Notify claimant
    await Notification.create({
      recipient: claim.claimedBy._id,
      message: `Your claim on "${item.title}" was accepted! 🎉 Contact details have been shared.`,
      type: 'claim_accepted',
      relatedItem: item._id
    });

    // Email BOTH parties with each other's contact info
    // Email to claimant (loser)
    await sendEmail({
      to: claim.claimedBy.email,
      subject: `Your claim was accepted — ${item.title} 🎉`,
      html: `
        <h2>Great news, ${claim.claimedBy.name}!</h2>
        <p>Your claim on <strong>${item.title}</strong> has been accepted!</p>
        <h3>Finder's Contact Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${item.postedBy.name}</li>
          <li><strong>Email:</strong> ${item.postedBy.email}</li>
          <li><strong>Phone:</strong> ${item.postedBy.phone}</li>
        </ul>
        <p>Please coordinate with them to recover your item.</p>
        <br/>
        <p>— Team EaseMyFind</p>
      `
    });

    // Email to item poster (finder)
    await sendEmail({
      to: item.postedBy.email,
      subject: `You accepted a claim — ${item.title}`,
      html: `
        <h2>Hi ${item.postedBy.name},</h2>
        <p>You accepted the claim on <strong>${item.title}</strong>.</p>
        <h3>Owner's Contact Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${claim.claimedBy.name}</li>
          <li><strong>Email:</strong> ${claim.claimedBy.email}</li>
          <li><strong>Phone:</strong> ${claim.claimedBy.phone}</li>
        </ul>
        <p>Please coordinate with them to return the item.</p>
        <br/>
        <p>— Team EaseMyFind</p>
      `
    });

    res.status(200).json({ message: 'Claim accepted successfully', claim });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @PATCH /api/claims/:claimId/reject — Reject a claim
export const rejectClaim = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.claimId)
      .populate('claimedBy')
      .populate('item');

    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    const item = await Item.findById(claim.item._id)
      .populate('postedBy');

    // Only item owner can reject
    if (item.postedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update claim
    claim.status = 'rejected';
    claim.reviewedBy = req.user._id;
    await claim.save();

    // Revert item status back to found
    item.status = 'found';
    await item.save();

    // Notify claimant
    await Notification.create({
      recipient: claim.claimedBy._id,
      message: `Your claim on "${item.title}" was rejected.`,
      type: 'claim_rejected',
      relatedItem: item._id
    });

    // Email claimant
    await sendEmail({
      to: claim.claimedBy.email,
      subject: `Your claim was rejected — ${item.title}`,
      html: `
        <h2>Hi ${claim.claimedBy.name},</h2>
        <p>Unfortunately your claim on <strong>${item.title}</strong> was not accepted.</p>
        <p>If you believe this is a mistake, please contact our support.</p>
        <br/>
        <p>— Team EaseMyFind</p>
      `
    });

    res.status(200).json({ message: 'Claim rejected', claim });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};