import mongoose, { Document, Schema, Types } from "mongoose";

export interface IReview extends Document {
  user: Types.ObjectId; // who wrote it  -> points to a User
  game: Types.ObjectId; // which game    -> points to a Game
  rating: number;
  comment: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    game: { type: Schema.Types.ObjectId, ref: "Game", required: true },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot be more than 5"],
      validate: { validator: Number.isInteger, message: "Rating must be a whole number" },
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, "Comment cannot be longer than 500 characters"],
      default: "",
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

reviewSchema.index({ user: 1, game: 1 }, { unique: true });
reviewSchema.index({ game: 1, createdAt: -1 });

export default mongoose.model<IReview>("Review", reviewSchema);
