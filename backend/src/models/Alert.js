import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    detectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Detection",
      required: true,
    },
    authorityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Authority",
      default: null,
    },
    recipient: {
      name: String,
      email: String,
      type: String,
    },
    recipientName: { type: String, default: "" },
    recipientEmail: { type: String, default: "" },
    subject: { type: String, default: "" },
    bodySnippet: { type: String, default: "" },
    status: {
      type: String,
      enum: ["PENDING", "SENT", "FAILED"],
      default: "PENDING",
    },
    sentAt: { type: Date, default: null },
    errorMessage: { type: String, default: "" },
    error: { type: String, default: "" },
    emailSubject: { type: String, default: "" },
  },
  { timestamps: true }
);

alertSchema.index({ detectionId: 1 });
alertSchema.index({ status: 1 });

const Alert = mongoose.model("Alert", alertSchema);
export default Alert;
