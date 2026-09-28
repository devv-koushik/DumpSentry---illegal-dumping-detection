import mongoose from "mongoose";

const authoritySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ["HOSPITAL", "CLINIC", "SCHOOL", "COLLEGE", "UNIVERSITY", "PWD", "MUNICIPAL", "CIVIC", "OTHER"],
    },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: "" },
    location: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Authority = mongoose.model("Authority", authoritySchema);
export default Authority;
