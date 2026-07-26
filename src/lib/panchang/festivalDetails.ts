export type FestivalDetail = {
  about: string;
  observance: string[];
  region?: string;
};

/** Longer descriptions shown in the festival detail modal. */
export const FESTIVAL_DETAILS: Record<string, FestivalDetail> = {
  ugadi: {
    about:
      "Marks the first day of the lunar new year. The year ahead is welcomed with the panchanga sravanam — a reading of the new almanac.",
    observance: ["Oil bath and new clothes", "Bevu-bella / pachadi with six tastes", "Panchanga sravanam at the temple"],
    region: "Andhra, Telangana, Karnataka, Maharashtra",
  },
  "ram-navami": {
    about: "Celebrates the birth of Sri Rama at midday in Ayodhya, on Chaitra Shukla Navami.",
    observance: ["Fasting until noon", "Ramayana parayana", "Panakam and kosambari offered as prasad"],
  },
  "hanuman-jayanti": {
    about: "The appearance day of Hanuman, celebrated on the full moon of Chaitra in most northern traditions.",
    observance: ["Hanuman Chalisa recitation", "Sindoor and oil offerings", "Temple visits at sunrise"],
  },
  "akshaya-tritiya": {
    about:
      "One of the most auspicious days of the year — anything begun today is believed to grow and never diminish. No muhurta is needed.",
    observance: ["Beginning new ventures", "Buying gold", "Charity and anna-dana"],
  },
  narasimha: {
    about: "The evening appearance of Narasimha, who protected Prahlada, on Vaishakha Shukla Chaturdashi.",
    observance: ["Fast broken after sunset", "Narasimha Kavacham recitation"],
  },
  "buddha-purnima": {
    about: "The birth, enlightenment and parinirvana of Gautama Buddha all fall on the Vaishakha full moon.",
    observance: ["Meditation and dana", "Visiting viharas", "Non-violence and vegetarian food"],
  },
  "vat-savitri": {
    about: "Married women observe a fast for the wellbeing of their husbands, recalling Savitri who won Satyavan back from Yama.",
    observance: ["Fast from sunrise", "Circumambulating the banyan tree with thread"],
    region: "North & West India",
  },
  "guru-purnima": {
    about: "Honours Veda Vyasa and, by extension, every teacher. The first full moon of the monsoon retreat.",
    observance: ["Guru puja and pada-puja", "Study of scripture", "Offering dakshina to teachers"],
  },
  "hariyali-teej": {
    about: "A monsoon festival for women welcoming the green of Shravana, dedicated to Parvati's reunion with Shiva.",
    observance: ["Swings and folk songs", "Green sarees and mehndi", "Nirjala or phalahar fast"],
  },
  "raksha-bandhan": {
    about: "Sisters tie a rakhi on their brothers' wrists on the Shravana full moon, and receive a pledge of protection.",
    observance: ["Rakhi tying after the Bhadra period ends", "Sweets and gifts", "Shravani Upakarma for many families"],
  },
  janmashtami: {
    about: "The midnight birth of Sri Krishna in Mathura, on Krishna Paksha Ashtami of Shravana.",
    observance: ["Fast until midnight", "Jhulan and Krishna alankara", "Bhagavata Purana 10th canto reading"],
  },
  hartalika: {
    about: "Parvati's austerity to win Shiva. Women keep a waterless fast for a happy married life.",
    observance: ["Nirjala fast", "Clay Shiva-Parvati lingas worshipped", "Night-long vigil"],
  },
  "ganesh-chaturthi": {
    about: "The birth of Ganesha. Clay murtis are installed at home and in pandals for one to ten days.",
    observance: ["Pranapratishtha of the murti", "Modak and durva offerings", "Avoid looking at the moon tonight", "Visarjan on Anant Chaturdashi"],
  },
  onam: {
    about: "The harvest festival of Kerala, marking the annual homecoming of King Mahabali on Thiruvonam nakshatra.",
    observance: ["Pookalam floral carpet", "Onasadya feast on a banana leaf", "Vallam kali and folk dances"],
    region: "Kerala",
  },
  "anant-chaturdashi": {
    about: "Worship of Ananta Padmanabha, and the day Ganesha murtis are given to the waters.",
    observance: ["Fourteen-knot ananta sutra tied", "Ganesh visarjan processions"],
  },
  "pitru-paksha": {
    about: "The concluding new moon of the fortnight dedicated to ancestors — tarpana is offered for all forgotten forebears.",
    observance: ["Tarpana and pinda-dana", "Feeding brahmins, crows and cows", "Sarva-pitru shraddha"],
  },
  navratri: {
    about: "Nine nights of Durga begin with Ghatasthapana, the installation of the kalasha and sowing of barley.",
    observance: ["Kalasha sthapana at the auspicious muhurta", "Fasting or satvik food for nine days", "Garba and Dandiya evenings"],
  },
  "durga-ashtami": {
    about: "The eighth night of Navratri, when Durga is worshipped as Mahagauri and the Sandhi Puja is performed.",
    observance: ["Kanya pujan", "Sandhi puja at the Ashtami-Navami junction"],
  },
  "maha-navami": {
    about: "The ninth day of Navratri. Tools, instruments and vehicles are worshipped as Ayudha Puja.",
    observance: ["Ayudha and Saraswati puja", "Kanya pujan and havan"],
  },
  dussehra: {
    about: "Victory of Rama over Ravana and of Durga over Mahishasura — the most auspicious day for beginnings.",
    observance: ["Ravana dahan", "Shami puja and Vidyarambham", "Aparajita puja in the afternoon"],
  },
  "sharad-purnima": {
    about: "The brightest full moon of the year. Kheer is left in the moonlight to absorb its nectar.",
    observance: ["Kheer under the moon", "Night-long Lakshmi vigil (Kojagari)"],
  },
  "karva-chauth": {
    about: "Married women fast from sunrise until moonrise for their husbands' long life.",
    observance: ["Sargi before dawn", "Nirjala fast all day", "Fast broken on sighting the moon through a sieve"],
    region: "North India",
  },
  dhanteras: {
    about: "The first day of Diwali, honouring Dhanvantari, who rose from the ocean of milk with the pot of amrita.",
    observance: ["Buying metal, gold or utensils", "Yama deepam lit at the doorway", "Lakshmi-Kubera puja"],
  },
  naraka: {
    about: "Krishna's victory over Narakasura, observed with an oil bath before sunrise.",
    observance: ["Abhyanga snana before dawn", "First lamps and crackers", "Chhoti Diwali feast"],
  },
  diwali: {
    about: "The festival of lights on Kartika Amavasya — Lakshmi is invited into a lit, clean home.",
    observance: ["Lakshmi-Ganesha puja in the pradosh period", "Rows of diyas and rangoli", "New account books opened"],
  },
  govardhan: {
    about: "Krishna lifting Govardhana hill; also Bali Pratipada and the Gujarati new year.",
    observance: ["Annakut — a mountain of food offered", "Govardhan made of cow dung and worshipped"],
  },
  "bhai-dooj": {
    about: "Yama visited his sister Yami on this day. Sisters apply tilak and pray for their brothers' long life.",
    observance: ["Tilak and aarti", "Shared meal at the sister's home"],
  },
  chhath: {
    about: "A four-day vrat to Surya and Chhathi Maiya, with offerings at sunset and sunrise on a riverbank.",
    observance: ["Nahay-khay and Kharna", "Sandhya arghya at sunset", "Usha arghya at sunrise"],
    region: "Bihar, Jharkhand, Eastern UP",
  },
  "tulsi-vivah": {
    about: "The ceremonial marriage of Tulsi to Shaligrama, which opens the Hindu wedding season.",
    observance: ["Tulsi mandap decorated", "Full wedding rites performed for the plant"],
  },
  "kartik-purnima": {
    about: "Dev Deepawali — the gods are said to descend to bathe in the Ganga, and the ghats are lined with lamps.",
    observance: ["Holy dip at sunrise", "Lamps floated on water", "Guru Nanak Jayanti for Sikhs"],
  },
  "gita-jayanti": {
    about: "The day Krishna spoke the Bhagavad Gita to Arjuna at Kurukshetra, on Mokshada Ekadashi.",
    observance: ["Gita parayana", "Ekadashi fast"],
  },
  vaikuntha: {
    about: "The gate of Vaikuntha is said to open at dawn — devotees pass through the Vaikuntha Dwara at temples.",
    observance: ["Fast and night vigil", "Dwara darshan before sunrise"],
    region: "South India",
  },
  "vasant-panchami": {
    about: "The first day of spring, dedicated to Saraswati, goddess of learning and the arts.",
    observance: ["Saraswati puja", "Vidyarambham for children", "Yellow clothes and food"],
  },
  "magha-purnima": {
    about: "The concluding full moon of the Magha bathing month, especially at Prayag.",
    observance: ["Holy bath at sunrise", "Dana of sesame, blankets and grain"],
  },
  shivratri: {
    about: "The great night of Shiva. Four prahar pujas are offered through the night on Krishna Chaturdashi.",
    observance: ["Day-long fast", "Abhishekam with milk, honey and bilva", "Night vigil with Om Namah Shivaya"],
  },
  holika: {
    about: "The bonfire recalling Prahlada's escape from Holika — the burning away of the old year.",
    observance: ["Bonfire lit in the pradosh period after Bhadra", "Parikrama of the fire with grain offerings"],
  },
  holi: {
    about: "The festival of colours on the day after Holika Dahan.",
    observance: ["Gulal and colour play", "Thandai and gujiya", "Visiting friends and family"],
  },
  "makar-sankranti": {
    about: "The sun turns north into Makara — the start of Uttarayana and the harvest season.",
    observance: ["Til-gud and pongal", "Holy dip and dana", "Kite flying"],
  },
  "mesha-sankranti": {
    about: "The sun enters Aries, beginning the solar year celebrated as Vishu, Puthandu, Baisakhi and Poila Boishakh.",
    observance: ["Vishukkani first sight", "New year feast", "Regional harvest fairs"],
  },
};
