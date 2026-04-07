
export interface DevelopmentInfo {
  size: string;
  description: string;
  image: string;
  weight: string; // approximate weight
  length: string; // approximate length
  milestones: string[];
  connection: string; // how baby connects to mama this week
}

export const babyGrowthData: Record<number, DevelopmentInfo> = {
  4: { 
    size: "Poppy Seed", 
    description: "Your baby is a tiny ball of cells, officially called a blastocyst. Major organs will begin to form soon.", 
    image: "🌱",
    weight: "< 1g",
    length: "0.1 cm",
    milestones: ["Implantation in uterine lining", "Placenta starts to form", "Amniotic sac developing"],
    connection: "Baby is finding their home in your womb for the next 9 months."
  },
  6: {
    size: "Sweet Pea",
    description: "The neural tube is closing and the heart is starting to beat. Tiny buds that will become arms and legs are appearing.",
    image: "🫛",
    weight: "0.5g",
    length: "0.5 cm",
    milestones: ["Heart starts beating", "Neural tube closes", "Basic facial features form"],
    connection: "Your baby's heart is beating at twice the rate of yours!"
  },
  8: { 
    size: "Raspberry", 
    description: "Fingers and toes are beginning to form, and the 'tail' at the bottom of baby's spinal cord is disappearing.", 
    image: "🫐",
    weight: "1g",
    length: "1.6 cm",
    milestones: ["Heart is beating at 150 BPM", "Brain waves are detectable", "Elbows and knees are forming"],
    connection: "Baby is already making tiny, jerky movements you can't feel yet."
  },
  10: {
    size: "Prune",
    description: "Baby is now officially a fetus! Most critical parts are formed and will continue to grow and mature.",
    image: "🫐",
    weight: "4g",
    length: "3.1 cm",
    milestones: ["Vital organs functioning", "Tooth buds forming", "Bones starting to harden"],
    connection: "Baby is starting to swallow and kick their tiny legs."
  },
  12: { 
    size: "Lime", 
    description: "Reflexes are developing! If you poke your tummy, baby will likely squirm, though you won't feel it yet.", 
    image: "🍋",
    weight: "14g",
    length: "5.4 cm",
    milestones: ["Fingernails and toenails appearing", "Kidneys start producing urine", "Vocal cords forming"],
    connection: "Baby is practicing opening and closing their tiny hands."
  },
  14: {
    size: "Lemon",
    description: "Baby can now squint, frown, and grimace. They may even be starting to suck their thumb.",
    image: "🍋",
    weight: "43g",
    length: "8.7 cm",
    milestones: ["Lanugo (fine hair) covers body", "Sucking reflex developing", "Neck getting longer"],
    connection: "Baby is starting to move their eyes behind closed eyelids."
  },
  16: { 
    size: "Avocado", 
    description: "The eyes are sensitive to light and the heart is pumping about 25 quarts of blood a day.", 
    image: "🥑",
    weight: "100g",
    length: "11.6 cm",
    milestones: ["Baby can make a fist", "Sucking reflex is developed", "Scalp hair pattern starting"],
    connection: "Baby might be sucking their thumb right now!"
  },
  18: {
    size: "Bell Pepper",
    description: "Baby is busy flexing their arms and legs. You might start to feel 'quickening'—tiny flutters in your tummy.",
    image: "🫑",
    weight: "190g",
    length: "14.2 cm",
    milestones: ["Ears in final position", "Myelin forming around nerves", "Unique fingerprints developing"],
    connection: "Baby can now hear sounds from outside your body!"
  },
  20: { 
    size: "Banana", 
    description: "Baby is covered in vernix caseosa, a greasy coating that protects their skin from the amniotic fluid.", 
    image: "🍌",
    weight: "300g",
    length: "25.6 cm",
    milestones: ["Gender may be visible on ultrasound", "Hearing is well developed", "Swallowing amniotic fluid"],
    connection: "Baby can hear your heartbeat and the sound of your voice."
  },
  22: {
    size: "Coconut",
    description: "Baby is starting to look like a miniature newborn. Their lips and eyebrows are more distinct.",
    image: "🥥",
    weight: "430g",
    length: "27.8 cm",
    milestones: ["Pancreas developing", "Inner ear fully formed", "Eyes formed but iris lacks pigment"],
    connection: "Baby is starting to develop a sense of touch."
  },
  24: { 
    size: "Corn", 
    description: "The inner ear is fully developed, meaning baby can tell if they are upside down or right side up.", 
    image: "🌽",
    weight: "600g",
    length: "30 cm",
    milestones: ["Real hair growing", "Taste buds forming", "Lungs developing branches"],
    connection: "Baby's sleep patterns are starting to become more regular."
  },
  26: {
    size: "Kale",
    description: "Baby is inhaling and exhaling small amounts of amniotic fluid, which is essential for lung development.",
    image: "🥬",
    weight: "760g",
    length: "35.6 cm",
    milestones: ["Eyes starting to open", "Brain activity for sight/sound", "Lungs producing surfactant"],
    connection: "Baby may respond to light shone on your belly."
  },
  28: { 
    size: "Eggplant", 
    description: "Eyes are partially open and baby is practicing blinking. The brain is developing billions of neurons.", 
    image: "🍆",
    weight: "1 kg",
    length: "37.6 cm",
    milestones: ["Dreams may occur during sleep", "Bone marrow making red blood cells", "Rhythmic breathing movements"],
    connection: "Baby is getting stronger and their kicks are becoming more distinct."
  },
  30: {
    size: "Cabbage",
    description: "Baby is surrounded by about a pint and a half of amniotic fluid, but that volume will decrease as they grow.",
    image: "🥬",
    weight: "1.3 kg",
    length: "39.9 cm",
    milestones: ["Eyes wide open", "Brain controlling body temp", "Bones fully developed but soft"],
    connection: "Baby is starting to mimic your sleep-wake cycles."
  },
  32: { 
    size: "Squash", 
    description: "Baby is practicing breathing and starting to move into the head-down position for birth.", 
    image: "🎃",
    weight: "1.7 kg",
    length: "42.4 cm",
    milestones: ["Toe nails fully formed", "Practicing inhaling amniotic fluid", "Brain can process light/noise"],
    connection: "Space is getting tight! You'll feel more rolls and stretches than kicks."
  },
  34: {
    size: "Cantaloupe",
    description: "Baby's central nervous system and lungs are maturing. They are gaining about half a pound a week.",
    image: "🍈",
    weight: "2.1 kg",
    length: "45 cm",
    milestones: ["Fat layers filling out", "Hearing fully developed", "Lungs almost fully mature"],
    connection: "Baby is listening to your conversations!"
  },
  36: { 
    size: "Papaya", 
    description: "The digestive system is fully developed and baby is gaining weight rapidly—about 30g a day.", 
    image: "🥭",
    weight: "2.6 kg",
    length: "47.4 cm",
    milestones: ["Immune system developing", "Skull bones are soft/pliable", "Liver and kidneys are working"],
    connection: "Baby is dropping lower into your pelvis to prepare for the big day."
  },
  38: {
    size: "Leek",
    description: "Baby is shedding lanugo and vernix. They are practicing their grasp and have a firm grip.",
    image: "🥬",
    weight: "3.1 kg",
    length: "49.8 cm",
    milestones: ["Organ systems ready", "Brain still developing rapidly", "Eye color may change after birth"],
    connection: "Baby is getting ready for their first breath of air!"
  },
  40: { 
    size: "Watermelon", 
    description: "Baby is fully grown and ready to meet the world! Their vision is blurry, but they recognize your voice.", 
    image: "🍉",
    weight: "3.4 kg",
    length: "51 cm",
    milestones: ["Fully developed lungs", "Strong grasp reflex", "Body fat is 15% of weight"],
    connection: "Baby is just as excited to see you as you are to see them!"
  },
};

export const getBabyGrowth = (week: number): DevelopmentInfo => {
  const keys = Object.keys(babyGrowthData).map(Number).sort((a, b) => b - a);
  const found = keys.find(k => k <= week) || 4;
  return babyGrowthData[found];
};
