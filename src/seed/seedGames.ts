import mongoose from "mongoose";
import { connectDB } from "../config/db";
import Game from "../models/Game";

export const sampleGames = [
  {
    title: "The Witcher 3: Wild Hunt",
    genre: "RPG",
    platform: "PC",
    releaseYear: 2015,
    description: "A huge open-world fantasy RPG where you hunt monsters, follow a missing-person story and make choices that change the world around you.",
  },
  {
    title: "Elden Ring",
    genre: "RPG",
    platform: "PC",
    releaseYear: 2022,
    description: "A challenging open-world action RPG about exploring a broken land, fighting giant bosses and finding your own path through it.",
  },
  {
    title: "Hades",
    genre: "Action",
    platform: "PC",
    releaseYear: 2020,
    description: "A fast roguelike where you fight your way out of the underworld, getting stronger each run while the story slowly unfolds.",
  },
  {
    title: "Stardew Valley",
    genre: "Simulation",
    platform: "PC",
    releaseYear: 2016,
    description: "A relaxing farming game about growing crops, raising animals, making friends in town and exploring the mines.",
  },
  {
    title: "Hollow Knight",
    genre: "Platformer",
    platform: "PC",
    releaseYear: 2017,
    description: "A dark 2D adventure through a ruined underground kingdom, with tough bosses, tight combat and lots of secrets.",
  },
  {
    title: "God of War",
    genre: "Action",
    platform: "PlayStation",
    releaseYear: 2018,
    description: "A father and son journey through Norse lands, with heavy axe combat and a strong, personal story.",
  },
  {
    title: "Forza Horizon 5",
    genre: "Racing",
    platform: "Xbox",
    releaseYear: 2021,
    description: "An open-world racing game set in Mexico, with hundreds of cars, festivals and races across deserts, jungles and cities.",
  },
  {
    title: "The Legend of Zelda: Breath of the Wild",
    genre: "Adventure",
    platform: "Nintendo",
    releaseYear: 2017,
    description: "An open-world adventure that lets you climb anything, glide across the map and solve problems in your own way.",
  },
  {
    title: "Portal 2",
    genre: "Puzzle",
    platform: "PC",
    releaseYear: 2011,
    description: "A first-person puzzle game about using portals to move through test chambers, with sharp humour and clever level design.",
  },
  {
    title: "Resident Evil 4",
    genre: "Horror",
    platform: "PlayStation",
    releaseYear: 2023,
    description: "A survival horror remake where you rescue a kidnapped girl from a village of hostile locals, balancing ammo and tense fights.",
  },
];

const seed = async () => {
  await connectDB();
  await Game.init();

  const count = await Game.countDocuments();
  if (count > 0) {
    console.log(`Games collection already has ${count} games. Seed skipped.`);
  } else {
    await Game.insertMany(sampleGames);
    console.log(`Seeded ${sampleGames.length} games`);
  }

  await mongoose.disconnect();
};

if (require.main === module) {
  seed();
}
