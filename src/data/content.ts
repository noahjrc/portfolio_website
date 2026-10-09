export interface Experience {
  company: string;
  short: string;
  role: string;
  location: string;
  dates: string;
  year: string;
  /** Logo shown on the game case; without one, the company name is set as a wordmark. */
  logo?: string;
  color: string;
  skills: string[];
  bullets: string[];
}

export interface Project {
  title: string;
  kind: string;
  stack: string[];
  /** One line per bullet; each becomes a numbered step in the cookbook's method. */
  steps: string[];
  image: string;
}

export interface Album {
  title: string;
  artist: string;
  coverImage: string;
  /**
   * Apple Music album id (the number at the end of an album's music.apple.com link).
   * Omit it when the album isn't on Apple Music: the record still spins, just silently.
   */
  appleId?: number;
  /** The song to preview; falls back to the album's first track. */
  track?: string;
  /**
   * For albums not on Apple Music: a YouTube video id. It plays through our own
   * controls, in a small visible YouTube player in the Now Playing card. The
   * video must allow embedding (GYBE's official "Topic" upload doesn't).
   */
  youtube?: string;
}

export const profile = {
  name: 'Noah Colbourne',
  handle: 'noahjrc',
  education: 'Bachelor of Engineering (Computer Engineering Co-op Program), Memorial University of Newfoundland and Labrador. Graduated May 2026.',
  bio: 'I’m a Computer Engineering graduate from Memorial University of Newfoundland and Labrador (Co-op, May 2026) and a full-stack developer. At SiftMed I built GenAI evaluation tooling, AWS event pipelines and customer-facing APIs; before that I worked in data and digitalization at Cenovus Energy and on robotics software with Paradigm. On my own time I built earworm, a music-rating app that 120 beta testers used to review over 500 albums. Outside of tech I keep a large vinyl collection (some favourites are on the shelf), cook a lot of Italian food, stay active, and play video games, including retro FPGA gaming.',
  email: 'noahcolbourne2002@gmail.com',
  github: 'https://github.com/noahjrc',
  linkedin: 'https://www.linkedin.com/in/noah-colbourne/',
  resume: '/Noah_Colbourne_Resume.pdf',
  photo: '/me.jpg',
};

export const experience: Experience[] = [
  {
    company: 'SiftMed',
    short: 'SIFTMED',
    role: 'Full-Stack Developer',
    location: 'St. John’s, NL',
    dates: 'Aug. 2025 – Oct. 2026',
    year: '2025–26',
    logo: '/SiftMed.png',
    color: '#2ec4b6',
    skills: ['TypeScript', 'NestJS', 'React', 'AWS', 'EventBridge', 'CloudWatch', 'REST', 'GraphQL', 'Salesforce', 'Docker', 'CircleCI', 'Claude Code'],
    bullets: [
      'Developed an evaluation tool for the company’s GenAI features, gating releases against hundreds of test questions to catch quality regressions before they reach customers',
      'Root-caused critical bugs in the OCR and AI pipelines through on-call production support',
      'Architected a scalable AWS Lambda/EventBridge pipeline streaming per-account usage metrics into Salesforce, with CloudWatch alarms for fault tolerance, giving Customer Success real-time engagement visibility',
      'Developed a secure REST webhook and file-upload API allowing high-value customers to integrate report delivery and document uploads with their own software',
      'Designed a configurable formatting system for AI-generated case notes, giving customers control over how extracted data renders in their documentation and saving hours of manual editing per case',
    ],
  },
  {
    company: 'Cenovus Energy',
    short: 'CENOVUS',
    role: 'Digitalization Engineering Student',
    location: 'St. John’s, NL',
    dates: 'May 2024 – Aug. 2024, Jan. 2025 – May 2025',
    year: '2024–25',
    logo: '/Cenovus.png',
    color: '#ff5a36',
    skills: ['Python', 'MATLAB', 'Databricks'],
    bullets: [
      'Automated the digitization of 1,600+ Mud Report and Bottomhole Assembly PDF/Excel files using Python, enhancing data accessibility and enabling streamlined dashboard development',
      'Reworked a MATLAB-based downhole vibration model in Python, enabling large-scale training and analysis in Databricks using structured Bottomhole Assembly datasets',
    ],
  },
  {
    company: 'Paradigm (Student Group)',
    short: 'PARADIGM',
    role: 'Software Team Member',
    location: 'St. John’s, NL',
    dates: 'Sept. 2023 – July 2024',
    year: '2023–24',
    logo: '/Paradigm.png',
    color: '#3a86ff',
    skills: ['ROS 2', 'Gazebo', 'C++', 'Pixhawk'],
    bullets: [
      'Implemented vehicle motion constraints in Gazebo using ROS 2 to support realistic robotics simulation',
      'Developed embedded firmware for the Pixhawk 6 controller to enable precise movement control',
    ],
  },
];

export const projects: Project[] = [
  {
    title: 'TripTailor',
    kind: 'Web App',
    stack: ['Go', 'React', 'PostgreSQL', 'OAuth2', 'Docker'],
    steps: [
      'Developed a microservices-based platform for sharing and exploring travel itineraries, enhancing trip planning efficiency.',
    ],
    image: '/Trip_Tailor.png',
  },
  {
    title: 'earworm',
    kind: 'Music Rating Mobile App',
    stack: ['Dart', 'Flutter', 'Google Cloud Platform', 'Firestore', 'MusicBrainz'],
    steps: [
      'Shipped a music-focused mobile platform for album rating and real-time social interaction; onboarded 120 beta testers who reviewed over 500 albums.',
      'Engineered real-time messaging and push notifications on Firestore and Cloud Functions, powering social interaction between users.',
      'Architected a self-hosted MusicBrainz replication pipeline on Google Compute Engine, syncing album and artist metadata to power in-app search.',
    ],
    image: '/earworm.png',
  },
];

export const albums: Album[] = [
  { title: 'The Low End Theory', artist: 'A Tribe Called Quest', coverImage: '/the_low_end_theory.webp', appleId: 278911460, track: 'Butter' },
  { title: 'Ants From Up There', artist: 'Black Country, New Road', coverImage: '/ants_from_up_there.webp', appleId: 1586070259, track: 'The Place Where He Inserted the Blade' },
  { title: 'My Ghosts Go Ghost', artist: 'By Storm', coverImage: '/my_ghosts_go_ghost.jpg', appleId: 1869647098, track: 'In My Town' },
  { title: 'Discovery', artist: 'Daft Punk', coverImage: '/discovery.webp', appleId: 697194953, track: 'Veridis Quo' },
  { title: 'The Rise and Fall of Ziggy Stardust and The Spiders From Mars', artist: 'David Bowie', coverImage: '/the_rise_and_fall_of_ziggy_stardust_and_the_spiders_from_mars.webp', appleId: 1039796877, track: 'Five Years' },
  { title: 'The Money Store', artist: 'Death Grips', coverImage: '/black_white.jpg', appleId: 515449028, track: 'Hacker' },
  { title: "Storm of the Light's Bane", artist: 'Dissection', coverImage: '/storm_of_the_lights_bane.webp', appleId: 1630970998, track: 'No Dreams Breed in Breathless Sleep' },
  { title: 'Breath From Another', artist: 'Esthero', coverImage: '/breath_from_another.webp', appleId: 519127875, track: 'Breath from Another' },
  { title: 'When The Pawn...', artist: 'Fiona Apple', coverImage: '/when_the_pawn.webp', appleId: 153019510, track: 'Limp' },
  { title: 'Lift Yr. Skinny Fists Like Antennas to Heaven!', artist: 'Godspeed You Black Emperor!', coverImage: '/lift_yr_skinny.webp', track: 'Storm', youtube: '5eZ_TgE3x_A' },
  { title: 'From Mars to Sirius', artist: 'Gojira', coverImage: '/from_mars_to_sirius.webp', appleId: 213374112, track: 'Where Dragons Dwell' },
  { title: 'By the Time I Get to Phoenix', artist: 'Injury Reserve', coverImage: '/by_the_time_i_get_to_phoenix.webp', appleId: 1578980409, track: 'Superman That' },
  { title: 'Grace', artist: 'Jeff Buckley', coverImage: '/grace.webp', appleId: 1046187510, track: 'Dream Brother' },
  { title: 'Veteran', artist: 'JPEGMAFIA', coverImage: '/veteran.webp', appleId: 1818406054, track: 'Rainbow Six' },
  { title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar', coverImage: '/to_pimp_a_butterfly.webp', appleId: 1440871877, track: "Wesley's Theory" },
  { title: 'The Miseducation of Lauryn Hill', artist: 'Lauryn Hill', coverImage: '/the_miseducation_of_lauryn_hill.webp', appleId: 1276760743, track: 'Ex-Factor' },
  { title: 'Lil Uzi Vert vs. the World', artist: 'Lil Uzi Vert', coverImage: '/lil_uzi_vert_vs_the_world.webp', appleId: 1116298635, track: 'Team Rocket' },
  { title: 'Ride the Lightning', artist: 'Metallica', coverImage: '/ride_the_lightning.webp', appleId: 579148345, track: 'Fade to Black' },
  { title: 'Madvillainy', artist: 'MF DOOM/Madlib', coverImage: '/madvillainy.webp', appleId: 887699504, track: 'Fancy Clown' },
  { title: 'Three Cheers for Sweet Revenge', artist: 'My Chemical Romance', coverImage: '/three_cheers_for_sweet_revenge.webp', appleId: 1156311431, track: 'Thank You for the Venom' },
  { title: 'Still Life', artist: 'Opeth', coverImage: '/still_life.webp', appleId: 276901909, track: 'Face of Melinda' },
  { title: 'Wish You Were Here', artist: 'Pink Floyd', coverImage: '/wish_you_were_here.webp', appleId: 1065973975, track: 'Wish You Were Here' },
  { title: 'In Rainbows', artist: 'Radiohead', coverImage: '/in_rainbows.webp', appleId: 1109714933, track: 'House of Cards' },
  { title: 'OK Computer', artist: 'Radiohead', coverImage: '/ok_computer.webp', appleId: 1097861387, track: 'Climbing Up the Walls' },
  { title: 'The Magnolia Electric Co', artist: 'Songs: Ohia', coverImage: '/the_magnolia_electric_co.webp', appleId: 789773387, track: "I've Been Riding With the Ghost" },
  { title: 'Disintegration', artist: 'The Cure', coverImage: '/disintegration.webp', appleId: 372100016, track: 'Pictures of You' },
  { title: 'Things Fall Apart', artist: 'The Roots', coverImage: '/things_fall_apart.webp', appleId: 1479929235, track: 'You Got Me' },
  { title: 'Ignorance', artist: 'The Weather Station', coverImage: '/ignorance.webp', appleId: 1524055739, track: 'Separated' },
  { title: 'Titanic Rising', artist: 'Weyes Blood', coverImage: '/titanic_rising.webp', appleId: 1450550344, track: 'Mirror Forever' },
];
