import mongoose, { Document, Schema } from "mongoose";

export const GENRES = [
  "Action",
  "Adventure",
  "RPG",
  "Strategy",
  "Simulation",
  "Sports",
  "Racing",
  "Puzzle",
  "Shooter",
  "Horror",
  "Platformer",
  "Other",
] as const;

export const PLATFORMS = [
  "PC",
  "PlayStation",
  "Xbox",
  "Nintendo",
  "Mobile",
  "Multi-platform",
] as const;

export interface IGame extends Document {
  title: string;
  genre: (typeof GENRES)[number];
  platform: (typeof PLATFORMS)[number];
  releaseYear: number;
  description: string;
  coverImage: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const gameSchema = new Schema<IGame>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot be longer than 100 characters"],
    },
    genre: {
      type: String,
      required: [true, "Genre is required"],
      enum: { values: GENRES, message: "Genre must be one of: " + GENRES.join(", ") },
    },
    platform: {
      type: String,
      required: [true, "Platform is required"],
      enum: { values: PLATFORMS, message: "Platform must be one of: " + PLATFORMS.join(", ") },
    },
    releaseYear: {
      type: Number,
      required: [true, "Release year is required"],
      min: [1970, "Release year must be 1970 or later"],
      max: [new Date().getFullYear() + 2, "Release year is too far in the future"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [1000, "Description cannot be longer than 1000 characters"],
    },
    coverImage: { type: String, trim: true, default: "" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

gameSchema.index(
  { title: 1, platform: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
gameSchema.index({ genre: 1 });

export default mongoose.model<IGame>("Game", gameSchema);
