import mongoose, { Document, Schema, Types } from "mongoose";

export const STATUSES = ["wishlist", "playing", "completed"] as const;
export type BacklogStatus = (typeof STATUSES)[number];

export interface IBacklogItem extends Document {
  user: Types.ObjectId; // whose backlog   -> points to a User
  game: Types.ObjectId; // which game      -> points to a Game
  status: BacklogStatus;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const backlogItemSchema = new Schema<IBacklogItem>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    game: { type: Schema.Types.ObjectId, ref: "Game", required: true },
    status: {
      type: String,
      enum: { values: STATUSES, message: "Status must be one of: " + STATUSES.join(", ") },
      default: "wishlist",
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

backlogItemSchema.index({ user: 1, game: 1 }, { unique: true });
backlogItemSchema.index({ user: 1, status: 1 });

export default mongoose.model<IBacklogItem>("BacklogItem", backlogItemSchema);
