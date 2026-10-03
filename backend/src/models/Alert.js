import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    detectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Detection",
      required: true,
      index: true,
    },
    detectionCode: {
      type: String,
      default: "",
      index: true,
    },
    context: {
      type: String,
      default: "",
    },
    contextType: {
      type: String,
      default: "OTHER_UNKNOWN",
    },
    authorityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Authority",
      default: null,
    },
    authorityName: {
      type: String,
      default: "",
    },
    recipient: {
      name: String,
      email: String,
      department: String,
    },
    recipientName: {
      type: String,
      default: "",
    },
    recipientEmail: {
      type: String,
      required: true,
      index: true,
    },
    subject: {
      type: String,
      default: "",
    },
    bodySnippet: {
      type: String,
      default: "",
    },
    // Notification & Email Status (pending, sent, failed)
    status: {
      type: String,
      enum: ["pending", "sent", "failed", "PENDING", "SENT", "FAILED"],
      default: "pending",
      index: true,
    },
    emailStatus: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
    },
    messageId: {
      type: String,
      default: null,
    },
    previewUrl: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    error: {
      type: String,
      default: "",
    },
    errorMessage: {
      type: String,
      default: "",
    },
    // Deduplication & idempotency key
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    lastRetryAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

alertSchema.index({ detectionId: 1, recipientEmail: 1 });
alertSchema.index({ status: 1, timestamp: -1 });

const Alert = mongoose.model("Alert", alertSchema);
export default Alert;
