
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
  8: { 
    size: "Raspberry", 
    description: "Fingers and toes are beginning to form, and the 'tail' at the bottom of baby's spinal cord is disappearing.", 
    image: "🫐",
    weight: "1g",
    length: "1.6 cm",
    milestones: ["Heart is beating at 150 BPM", "Brain waves are detectable", "Elbows and knees are forming"],
    connection: "Baby is already making tiny, jerky movements you can't feel yet."
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
  16: { 
    size: "Avocado", 
    description: "The eyes are sensitive to light and the heart is pumping about 25 quarts of blood a day.", 
    image: "🥑",
    weight: "100g",
    length: "11.6 cm",
    milestones: ["Baby can make a fist", "Sucking reflex is developed", "Scalp hair pattern starting"],
    connection: "Baby might be sucking their thumb right now!"
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
  24: { 
    size: "Corn", 
    description: "The inner ear is fully developed, meaning baby can tell if they are upside down or right side up.", 
    image: "🌽",
    weight: "600g",
    length: "30 cm",
    milestones: ["Real hair growing", "Taste buds forming", "Lungs developing branches"],
    connection: "Baby's sleep patterns are starting to become more regular."
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
  32: { 
    size: "Squash", 
    description: "Baby is practicing breathing and starting to move into the head-down position for birth.", 
    image: "🎃",
    weight: "1.7 kg",
    length: "42.4 cm",
    milestones: ["Toe nails fully formed", "Practicing inhaling amniotic fluid", "Brain can process light/noise"],
    connection: "Space is getting tight! You'll feel more rolls and stretches than kicks."
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
