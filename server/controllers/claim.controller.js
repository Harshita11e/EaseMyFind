import Claim from '../models/Claim.model.js';
import Item from '../models/Item.model.js';
import Notification from '../models/Notification.model.js';
import User from '../models/User.model.js';
import { sendEmail } from '../utils/sendEmail.js';


// ✅ Check how many secret details match
const countSecretMatches = (secretDetails, proofDescription) => {
  const proof = proofDescription.toLowerCase();
  let matches = 0;
  let total = 0;

  if (secretDetails.primary) {
    total++;
    const keywords = secretDetails.primary.toLowerCase().split(' ')
      .filter(w => w.length > 3);
    const matched = keywords.some(word => proof.includes(word));
    if (matched) matches++;
  }

  if (secretDetails.secondary) {
    total++;
    const keywords = secretDetails.secondary.toLowerCase().split(' ')
      .filter(w => w.length > 3);
    const matched = keywords.some(word => proof.includes(word));
    if (matched) matches++;
  }

  if (secretDetails.tertiary) {
    total++;
    const keywords = secretDetails.tertiary.toLowerCase().split(' ')
      .filter(w => w.length > 3);
    const matched = keywords.some(word => proof.includes(word));
    if (matched) matches++;
  }

  return { matches, total };
};

// @POST /api/claims/:itemId — Submit a claim
export const submitClaim = async (req, res) => {
  try {
    const { proofDescription } = req.body;
    const itemId = req.params.itemId;

    const item = await Item.findById(itemId).populate('postedBy');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // ✅ FIX 1: Only FOUND items can be claimed
    if (item.status !== 'found') {
      return res.status(400).json({
        message: item.status === 'lost'
          ? 'This is a lost item. If you found it, post it as a Found listing so the owner can claim it!'
          : item.status === 'claimed'
            ? 'This item already has a pending claim.'
            : 'This item has already been resolved.'
      });
    }

    // ✅ FIX 2: Can't claim your own item
    if (item.postedBy._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You can't claim your own item" });
    }

    // ✅ FIX 3: Check if already claimed by this user
    const existingClaim = await Claim.findOne({
      item: itemId,
      claimedBy: req.user._id
    });

    if (existingClaim) {
      return res.status(400).json({
        message: existingClaim.status === 'rejected'
          ? 'Your previous claim was rejected. You cannot claim this item again.'
          : 'You already submitted a claim for this item'
      });
    }

    // ✅ FIX 4: Proof description minimum length
    if (!proofDescription || proofDescription.trim().length < 20) {
      return res.status(400).json({
        message: 'Please provide a detailed proof description (at least 20 characters)'
      });
    }

    // Get proof image if uploaded
    const proofImage = req.file ? req.file.path : '';

    // Create claim
    const claim = await Claim.create({
      item: itemId,
      claimedBy: req.user._id,
      proofDescription: proofDescription.trim(),
      proofImage
    });

    // ✅ FIX 5: Update item status to claimed
    item.status = 'claimed';
    await item.save();

    // Notify item poster
    await Notification.create({
      recipient: item.postedBy._id,
      message: `Someone claimed your found item "${item.title}" — review their proof!`,
      type: 'new_claim',
      relatedItem: item._id
    });

    // Email item poster
    await sendEmail({
      to: item.postedBy.email,
      subject: `New Claim on your Found item — ${item.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Claim Received! 🙋</h2>
          <p>Hi ${item.postedBy.name},</p>
          <p>Someone has submitted a claim on your found item <strong>${item.title}</strong>.</p>
          <p>Please login to EaseMyFind to review their proof and decide whether to accept or reject the claim.</p>
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0; color: #64748b; font-size: 14px;">⚠️ Compare their proof with your secret details to verify ownership.</p>
          </div>
          <a href="${process.env.CLIENT_URL}/items/${item._id}" 
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 8px;">
            Review Claim →
          </a>
          <p style="margin-top: 24px; color: #94a3b8; font-size: 12px;">— Team EaseMyFind</p>
        </div>
      `
    });

    res.status(201).json({ message: 'Claim submitted successfully', claim });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }

  // After creating claim — add match analysis
  const { matches, total } = countSecretMatches(
    item.secretDetails,
    proofDescription
  );

  const matchScore = total > 0 ? Math.round((matches / total) * 100) : 0;

  // Update claim with match score
  await Claim.findByIdAndUpdate(claim._id, { matchScore });

  // Update notification with match info
  await Notification.create({
    recipient: item.postedBy._id,
    message: `New claim on "${item.title}" — ${matchScore}% keyword match detected!`,
    type: 'new_claim',
    relatedItem: item._id
  });
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
      .populate('item', 'title images status category location')
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

    const item = await Item.findById(claim.item._id).populate('postedBy');

    // Only item owner can accept
    if (item.postedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // ✅ FIX 6: Prevent accepting already processed claims
    if (claim.status !== 'pending') {
      return res.status(400).json({
        message: `This claim is already ${claim.status}`
      });
    }

    // Update claim status
    claim.status = 'accepted';
    claim.reviewedBy = req.user._id;
    await claim.save();

    // ✅ FIX 7: Auto resolve item when claim accepted
    item.status = 'resolved';
    await item.save();

    // Reject all other pending claims for this item
    await Claim.updateMany(
      { item: item._id, _id: { $ne: claim._id }, status: 'pending' },
      { status: 'rejected' }
    );

    // Notify rejected claimants
    const rejectedClaims = await Claim.find({
      item: item._id,
      _id: { $ne: claim._id }
    }).populate('claimedBy');

    for (const rejected of rejectedClaims) {
      await Notification.create({
        recipient: rejected.claimedBy._id,
        message: `Your claim on "${item.title}" was not accepted as another claim was verified.`,
        type: 'claim_rejected',
        relatedItem: item._id
      });
    }

    // Notify accepted claimant
    await Notification.create({
      recipient: claim.claimedBy._id,
      message: `Your claim on "${item.title}" was accepted! 🎉 Contact details shared via email.`,
      type: 'claim_accepted',
      relatedItem: item._id
    });

    // ✅ FIX 8: Professional email to claimant (loser/owner)
    await sendEmail({
      to: claim.claimedBy.email,
      subject: `Your claim was accepted — ${item.title} 🎉`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Great news! Your claim was accepted 🎉</h2>
          <p>Hi ${claim.claimedBy.name},</p>
          <p>Your claim on <strong>${item.title}</strong> has been verified and accepted!</p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin: 16px 0;">
            <h3 style="margin: 0 0 12px; color: #16a34a;">Finder's Contact Details</h3>
            <p style="margin: 4px 0;"><strong>Name:</strong> ${item.postedBy.name}</p>
            <p style="margin: 4px 0;"><strong>Email:</strong> ${item.postedBy.email}</p>
            <p style="margin: 4px 0;"><strong>Phone:</strong> ${item.postedBy.phone}</p>
          </div>
          <p>Please coordinate with the finder to recover your item safely.</p>
          <p style="color: #64748b; font-size: 13px;">⚠️ Please meet in a safe public place to collect your item.</p>
          <p style="margin-top: 24px; color: #94a3b8; font-size: 12px;">— Team EaseMyFind</p>
        </div>
      `
    });

    // ✅ FIX 9: Professional email to finder
    await sendEmail({
      to: item.postedBy.email,
      subject: `You accepted a claim — ${item.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Claim Accepted Successfully ✅</h2>
          <p>Hi ${item.postedBy.name},</p>
          <p>You accepted the ownership claim on <strong>${item.title}</strong>. The item has been marked as resolved.</p>
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 20px; border-radius: 8px; margin: 16px 0;">
            <h3 style="margin: 0 0 12px; color: #2563eb;">Owner's Contact Details</h3>
            <p style="margin: 4px 0;"><strong>Name:</strong> ${claim.claimedBy.name}</p>
            <p style="margin: 4px 0;"><strong>Email:</strong> ${claim.claimedBy.email}</p>
            <p style="margin: 4px 0;"><strong>Phone:</strong> ${claim.claimedBy.phone}</p>
          </div>
          <p>Please coordinate with the owner to return the item safely.</p>
          <p style="color: #64748b; font-size: 13px;">⚠️ Please meet in a safe public place to return the item.</p>
          <p style="color: #64748b; font-size: 13px;">Thank you for being a responsible community member! 🙏</p>
          <p style="margin-top: 24px; color: #94a3b8; font-size: 12px;">— Team EaseMyFind</p>
        </div>
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

    const item = await Item.findById(claim.item._id).populate('postedBy');

    // Only item owner can reject
    if (item.postedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // ✅ FIX 10: Prevent rejecting already processed claims
    if (claim.status !== 'pending') {
      return res.status(400).json({
        message: `This claim is already ${claim.status}`
      });
    }

    // Update claim
    claim.status = 'rejected';
    claim.reviewedBy = req.user._id;
    await claim.save();

    // ✅ FIX 11: Revert item status back to found so others can claim
    const otherPendingClaims = await Claim.countDocuments({
      item: item._id,
      status: 'pending',
      _id: { $ne: claim._id }
    });

    if (otherPendingClaims === 0) {
      item.status = 'found';
      await item.save();
    }

    // Notify claimant
    await Notification.create({
      recipient: claim.claimedBy._id,
      message: `Your claim on "${item.title}" was not accepted. The proof didn't match.`,
      type: 'claim_rejected',
      relatedItem: item._id
    });

    // Email claimant
    await sendEmail({
      to: claim.claimedBy.email,
      subject: `Your claim was not accepted — ${item.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Claim Not Accepted</h2>
          <p>Hi ${claim.claimedBy.name},</p>
          <p>Unfortunately your claim on <strong>${item.title}</strong> was not accepted as the proof provided did not match.</p>
          <div style="background: #fff7ed; border: 1px solid #fed7aa; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0; color: #9a3412; font-size: 14px;">If you believe this is a mistake, you can contact our support or try providing more specific proof details.</p>
          </div>
          <p style="margin-top: 24px; color: #94a3b8; font-size: 12px;">— Team EaseMyFind</p>
        </div>
      `
    });

    res.status(200).json({ message: 'Claim rejected', claim });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};