import { Trimester } from '../types.ts';

export interface EducationArticle {
  id: string;
  title: string;
  category: 'Pregnancy Health' | 'Baby Development' | 'Nutrition' | 'Newborn Care';
  trimester: Trimester | 'General' | 'Newborn';
  source: string;
  link: string;
  summary: string;
}

export interface StageGuidance {
  title: string;
  feelings: string[];
  happenings: string[];
  focus: string[];
}

export const EDUCATION_CATEGORIES = [
  'All',
  'Pregnancy Health',
  'Baby Development',
  'Nutrition',
  'Newborn Care',
] as const;

export const educationArticles: EducationArticle[] = [
  {
    id: '1',
    title: 'Pregnancy week by week',
    category: 'Pregnancy Health',
    trimester: 'General',
    source: 'Mayo Clinic',
    link: 'https://www.mayoclinic.org/healthy-lifestyle/pregnancy-week-by-week/basics/healthy-pregnancy/hlv-20049471',
    summary:
      "Understanding the changes in your body and your baby's development during each week of pregnancy is crucial for a healthy journey. This guide covers everything from early symptoms to preparing for labor. It emphasizes the importance of prenatal care, regular checkups, and monitoring any unusual symptoms. By staying informed about each trimester, you can better manage expectations and reduce anxiety. The Mayo Clinic provides detailed insights into fetal growth milestones and maternal health tips for every stage.",
  },
  {
    id: '2',
    title: 'Your pregnancy and baby guide',
    category: 'Pregnancy Health',
    trimester: 'General',
    source: 'NHS',
    link: 'https://www.nhs.uk/pregnancy/',
    summary:
      "The NHS pregnancy guide offers comprehensive advice on staying healthy, from the moment you find out you're pregnant to the first few weeks with your newborn. It includes information on common pregnancy complaints, such as morning sickness and tiredness, and how to manage them effectively. The guide also covers important screenings and tests offered during the three trimesters. It provides clear instructions on when to seek medical help and how to prepare for a safe birth.",
  },
  {
    id: '3',
    title: 'Healthy diet during pregnancy',
    category: 'Nutrition',
    trimester: 'General',
    source: 'WHO',
    link: 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet',
    summary:
      'WHO guidelines emphasize that a healthy diet during pregnancy is fundamental for both maternal and fetal health. It should include adequate energy, protein, vitamins, and minerals obtained through a variety of foods. Key recommendations include increasing intake of green and orange vegetables, meat, fish, beans, and whole grains. The guidelines also highlight the importance of iron and folic acid supplementation to prevent anemia and birth defects.',
  },
  {
    id: '4',
    title: 'Nutrition During Pregnancy',
    category: 'Nutrition',
    trimester: 'General',
    source: 'CDC',
    link: 'https://www.cdc.gov/breastfeeding/about/nutrition-during-pregnancy.html',
    summary:
      'The CDC provides vital information on the nutritional needs of pregnant women to support the growth and development of the fetus. It highlights the importance of folic acid, iron, calcium, and vitamin D in a daily diet. The resource also discusses healthy weight gain during pregnancy based on pre-pregnancy BMI. It offers practical tips for choosing nutrient-dense foods and avoiding harmful substances like mercury in certain fish.',
  },
  {
    id: '5',
    title: 'Fetal development',
    category: 'Baby Development',
    trimester: 'General',
    source: 'March of Dimes',
    link: 'https://www.marchofdimes.org/find-support/topics/pregnancy/fetal-development',
    summary:
      "March of Dimes tracks the incredible journey of fetal development from conception to birth. This article explains how the baby's organs, limbs, and systems form and mature over the 40 weeks of pregnancy. It highlights critical milestones, such as the heartbeat starting in the first trimester and lung development in the third. The resource also provides information on how maternal health choices directly impact the baby's growth.",
  },
  {
    id: '6',
    title: 'Important Milestones: Your Baby By Six Months',
    category: 'Baby Development',
    trimester: 'Newborn',
    source: 'CDC',
    link: 'https://www.cdc.gov/ncbddd/actearly/milestones/milestones-6mo.html',
    summary:
      "The CDC's milestone tracker helps parents monitor their baby's physical, social, and cognitive development during the first six months. It covers key behaviors such as rolling over, responding to sounds, and beginning to babble. The guide provides tips to help parents identify potential developmental delays early on. It also suggests activities parents can do to encourage growth, like tummy time and reading.",
  },
  {
    id: '7',
    title: 'Newborn care: 10 tips for stressed-out parents',
    category: 'Newborn Care',
    trimester: 'Newborn',
    source: 'Mayo Clinic',
    link: 'https://www.mayoclinic.org/healthy-lifestyle/infant-and-toddler-health/in-depth/newborn-care/art-20043293',
    summary:
      'Caring for a newborn can be overwhelming, and the Mayo Clinic offers ten practical tips to help parents navigate the first few weeks. These include advice on handling the baby safely, supporting the head and neck, and the importance of hand hygiene. The article also covers basic needs like feeding, diapering, and soothing a crying infant. It emphasizes the need for parents to take care of their own mental and physical health.',
  },
  {
    id: '8',
    title: 'Caring for a newborn baby',
    category: 'Newborn Care',
    trimester: 'Newborn',
    source: 'NHS',
    link: 'https://www.nhs.uk/conditions/baby/caring-for-a-newborn/',
    summary:
      "The NHS provides a comprehensive overview of newborn care, covering everything from bathing and dressing to sleep safety. It highlights the Back to Sleep campaign to reduce the risk of SIDS and provides guidance on room temperature. The resource also explains how to care for the umbilical cord stump and what to expect during the first health visitor checks. It offers advice on bonding with your baby through touch and talk.",
  },
  {
    id: '9',
    title: 'Antenatal care for a positive pregnancy experience',
    category: 'Pregnancy Health',
    trimester: 'General',
    source: 'WHO',
    link: 'https://www.who.int/publications/i/item/9789241549912',
    summary:
      'This WHO publication outlines the global standards for antenatal care, aiming to provide a positive experience for every woman. It recommends a minimum of eight contacts with healthcare providers to monitor health and provide support. The guidelines cover nutritional interventions, maternal and fetal assessment, and preventive measures for common complications. It also addresses the importance of respectful care and communication.',
  },
  {
    id: '10',
    title: 'Safe sleep for your baby',
    category: 'Newborn Care',
    trimester: 'Newborn',
    source: 'March of Dimes',
    link: 'https://www.marchofdimes.org/find-support/topics/baby/safe-sleep-your-baby',
    summary:
      'March of Dimes provides critical guidelines for ensuring your baby sleeps safely to prevent Sudden Infant Death Syndrome (SIDS). The article emphasizes placing the baby on their back for every sleep, on a firm, flat surface. It advises against using soft bedding, pillows, or bumper pads in the crib. The resource also discusses the benefits of room-sharing without bed-sharing for the first six months.',
  },
  {
    id: '11',
    title: 'Iron and Folic Acid Supplementation',
    category: 'Nutrition',
    trimester: Trimester.FIRST,
    source: 'WHO',
    link: 'https://www.who.int/elena/titles/guidance_summaries/daily_iron_folic_pregnant/en/',
    summary:
      'WHO recommends daily oral iron and folic acid supplementation with 30-60 mg of elemental iron and 400 ug of folic acid for pregnant women to prevent maternal anaemia, puerperal sepsis, low birth weight, and preterm birth. This intervention is particularly critical in the first trimester when fetal organ development is most rapid. Regular supplementation has been shown to improve maternal iron stores and reduce the incidence of neural tube defects.',
  },
  {
    id: '12',
    title: 'Managing Morning Sickness effectively',
    category: 'Pregnancy Health',
    trimester: Trimester.FIRST,
    source: 'Mayo Clinic',
    link: 'https://www.mayoclinic.org/diseases-conditions/morning-sickness/symptoms-causes/syc-20375254',
    summary:
      'Nausea and vomiting during early pregnancy can be challenging. This guide outlines proven strategies to manage morning sickness, including eating small, frequent meals, staying hydrated, and avoiding common triggers. It explores remedies such as ginger and vitamin B6 supplementation. Knowing when to contact your healthcare provider if symptoms become severe is also covered.',
  },
  {
    id: '13',
    title: 'Crucial First Trimester Screenings',
    category: 'Pregnancy Health',
    trimester: Trimester.FIRST,
    source: 'ACOG',
    link: 'https://www.acog.org/womens-health/faqs/routine-tests-during-pregnancy',
    summary:
      'The first trimester involves several important diagnostic tests. This article explains what to expect during initial blood work and ultrasound appointments. It details the purpose of genetic screening panels and how they help assess the risk of chromosomal differences, giving parents peace of mind and the necessary information to prepare.',
  },
  {
    id: '14',
    title: 'Staying Active: Early Pregnancy Fitness',
    category: 'Pregnancy Health',
    trimester: Trimester.FIRST,
    source: 'NHS',
    link: 'https://www.nhs.uk/pregnancy/keeping-well/exercise/',
    summary:
      'Maintaining a safe exercise routine during the first trimester has significant benefits for both physical endurance and mental well-being. This guide highlights recommended activities like walking, swimming, and prenatal yoga, while indicating which high-impact activities to avoid. Consistent, moderate exercise helps prepare the body for the journey ahead.',
  },
  {
    id: '15',
    title: 'Preparing for the Anatomy Scan',
    category: 'Baby Development',
    trimester: Trimester.SECOND,
    source: 'March of Dimes',
    link: 'https://www.marchofdimes.org/find-support/topics/pregnancy/ultrasound-during-pregnancy',
    summary:
      "Usually performed around 20 weeks, the anatomy scan provides a comprehensive look at your baby's development. This article walks you through exactly what technicians are looking for, including organ function and limb development. It also discusses the exciting possibility of discovering the baby's sex, if desired.",
  },
  {
    id: '16',
    title: 'Sleeping Comfortably With a Growing Bump',
    category: 'Pregnancy Health',
    trimester: Trimester.SECOND,
    source: 'Sleep Foundation',
    link: 'https://www.sleepfoundation.org/pregnancy/sleeping-during-2nd-trimester',
    summary:
      'As your baby grows, finding a comfortable sleep position becomes more difficult. This guide explains the benefits of sleeping on your side (particularly the left side) to improve blood flow to the uterus. It also offers practical advice on utilizing pregnancy pillows to provide necessary support for your back and abdomen.',
  },
  {
    id: '17',
    title: 'Managing Pregnancy Heartburn',
    category: 'Nutrition',
    trimester: Trimester.SECOND,
    source: 'ACOG',
    link: 'https://www.acog.org/womens-health/faqs/what-can-i-take-for-heartburn-during-pregnancy',
    summary:
      'Hormonal changes and physical pressure frequently cause heartburn in the second trimester. This resource provides dietary modifications, such as avoiding spicy or acidic foods and not eating close to bedtime. It also reviews safe, over-the-counter antacid options to help manage ongoing discomfort.',
  },
  {
    id: '18',
    title: 'Braxton Hicks vs. Real Labor',
    category: 'Pregnancy Health',
    trimester: Trimester.THIRD,
    source: 'Mayo Clinic',
    link: 'https://www.mayoclinic.org/healthy-lifestyle/labor-and-delivery/in-depth/signs-of-labor/art-20046184',
    summary:
      'Understanding the difference between practice contractions and actual true labor is essential in the final stretch. This article explains how to identify Braxton Hicks contractions, which are typically irregular and relieve with movement or hydration, compared to the consistent, intensifying rhythm of true labor contractions.',
  },
  {
    id: '19',
    title: 'Packing Your Hospital Bag',
    category: 'Pregnancy Health',
    trimester: Trimester.THIRD,
    source: 'NHS',
    link: 'https://www.nhs.uk/pregnancy/labour-and-birth/preparing-for-the-birth/pack-your-bag-for-labour/',
    summary:
      'An essential checklist for the final weeks of pregnancy. This detailed guide covers exactly what you need to pack for yourself, your birth partner, and your newborn. From comfortable clothing and important medical records to baby outfits and postpartum care supplies, this ensures you are fully prepared for the big day.',
  },
  {
    id: '20',
    title: 'Preparing for Breastfeeding',
    category: 'Nutrition',
    trimester: Trimester.THIRD,
    source: 'CDC',
    link: 'https://www.cdc.gov/breastfeeding/about/preparing-to-breastfeed.html',
    summary:
      'Laying the groundwork before the baby arrives can make the initial breastfeeding experience much smoother. This article covers the importance of lactation education, gathering the right supplies like supportive bras and nipple cream, and understanding early baby feeding cues to set both mother and baby up for success.',
  },
];

export function getStageGuidance(trimester: Trimester, isPostpartum: boolean): StageGuidance {
  if (isPostpartum) {
    return {
      title: 'Newborn stage',
      feelings: [
        'You may feel deeply bonded one moment and overwhelmed the next.',
        'Sleep deprivation can make mood swings, worry, and irritability stronger.',
        'Recovery and confidence usually improve week by week.',
      ],
      happenings: [
        'Feeding can be frequent and irregular in the first weeks.',
        'Newborn sleep is fragmented, with short day and night cycles.',
        'Growth spurts, cluster feeding, and crying peaks are common.',
      ],
      focus: [
        'Safe sleep setup (back to sleep, firm surface, clear crib).',
        'Track feeds, diapers, weight checks, and hydration.',
        'Ask for support early and monitor maternal mental health.',
      ],
    };
  }

  if (trimester === Trimester.FIRST) {
    return {
      title: 'First trimester',
      feelings: [
        'Nausea, fatigue, and emotional shifts are common.',
        'Appetite can fluctuate with smell and taste changes.',
        'Anxiety is normal as you adjust to early pregnancy.',
      ],
      happenings: [
        'Major organ development begins early and rapidly.',
        'Hormonal changes can affect energy and digestion.',
        'First scans and screening tests are usually scheduled.',
      ],
      focus: [
        'Folate/iron intake and hydration consistency.',
        'Rest, symptom tracking, and early prenatal care.',
        'Review medications and supplements with your clinician.',
      ],
    };
  }

  if (trimester === Trimester.SECOND) {
    return {
      title: 'Second trimester',
      feelings: [
        'Energy often improves compared to early pregnancy.',
        'You may feel more emotionally stable and connected.',
        'Body-image and sleep comfort concerns may increase.',
      ],
      happenings: [
        'Bump growth accelerates and movement may become noticeable.',
        'Anatomy scan and growth checks become central.',
        'Muscle/back strain and heartburn can become more frequent.',
      ],
      focus: [
        'Balanced nutrition and gradual activity.',
        'Sleep support, posture care, and hydration.',
        'Prepare questions for anatomy and follow-up scans.',
      ],
    };
  }

  return {
    title: 'Third trimester',
    feelings: [
      'Excitement and anxiety can rise as birth approaches.',
      'Sleep may become lighter with frequent wake-ups.',
      'Physical fatigue and emotional sensitivity may increase.',
    ],
    happenings: [
      'Rapid fetal growth and stronger fetal movement patterns.',
      'Braxton Hicks, pelvic pressure, and swelling may appear.',
      'Birth planning and final checks become frequent.',
    ],
    focus: [
      'Monitor warning signs and movement patterns.',
      'Pack essentials and confirm birth/support plans.',
      'Plan postpartum support and newborn-safe home setup.',
    ],
  };
}
