export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export const navigation: NavItem[] = [
  { label: 'Home', href: '/' },
  {
    label: 'Tuincentrum',
    href: '/tuincentrum/',
    children: [
      { label: 'Almere', href: '/tuincentrum/almere/' },
      { label: 'Amersfoort', href: '/tuincentrum/amersfoort/' },
      { label: 'Amsterdam', href: '/tuincentrum/amsterdam/' },
      { label: 'Den Haag', href: '/tuincentrum/den-haag/' },
      { label: 'Den Helder', href: '/tuincentrum/den-helder/' },
      { label: 'Drachten', href: '/tuincentrum/drachten/' },
      { label: 'Hardenberg', href: '/tuincentrum/hardenberg/' },
      { label: 'Leusden', href: '/tuincentrum/leusden/' },
      { label: 'Oosterhout', href: '/tuincentrum/oosterhout/' },
      { label: 'Tilburg', href: '/tuincentrum/tilburg/' },
    ],
  },
  {
    label: 'Planten',
    href: '/planten/',
    children: [
      { label: 'Aglaonema Pictum Tricolor', href: '/planten/aglaonema-pictum-tricolor/' },
      { label: 'Alocasia Azlanii', href: '/planten/alocasia-azlanii/' },
      { label: 'Alocasia Frydek Variegata', href: '/planten/alocasia-frydek-variegata/' },
      { label: 'Calathea Medaillon', href: '/planten/calathea-medaillon/' },
      { label: 'Ficus Shivereana Moonshine', href: '/planten/ficus-shivereana-moonshine/' },
      { label: 'Honingboom', href: '/planten/honingboom/' },
      { label: 'Hoya Burtoniae', href: '/planten/hoya-burtoniae/' },
      { label: 'Hoya Sigillatis', href: '/planten/hoya-sigillatis/' },
      { label: 'Philodendron Joepii', href: '/planten/philodendron-joepii/' },
      { label: 'Sansevieria Zeylanica', href: '/planten/sansevieria-zeylanica/' },
    ],
  },
  {
    label: 'Decoratie',
    href: '/decoratie/',
    children: [
      { label: 'Tuinmeubelsbeschermers', href: '/decoratie/tuinmeubelsbeschermers/' },
      { label: 'Sfeerverlichting buiten', href: '/decoratie/sfeerverlichting-buiten/' },
      { label: 'Staandeplantenbakken', href: '/decoratie/staandeplantenbakken/' },
      { label: 'Windmolen voor thuis', href: '/decoratie/windmolen-voor-thuis/' },
      { label: 'Tuinwanddecoratie', href: '/decoratie/tuinwanddecoratie/' },
      { label: 'Plantenbakhouder', href: '/decoratie/plantenbakhouder/' },
      { label: 'Hangingbaskets', href: '/decoratie/hangingbaskets/' },
      { label: 'Plantenmanden', href: '/decoratie/plantenmanden/' },
      { label: 'Plantenschalen', href: '/decoratie/plantenschalen/' },
      { label: 'Plantenbakken', href: '/decoratie/plantenbakken/' },
    ],
  },
  {
    label: 'Gereedschap',
    href: '/gereedschap/',
    children: [
      { label: 'Tuingereedschapsetjes', href: '/gereedschap/tuingereedschapsetjes/' },
      { label: 'Gazongereedschap', href: '/gereedschap/gazongereedschap/' },
      { label: 'Snoeigereedschap', href: '/gereedschap/snoeigereedschap/' },
      { label: 'Zaaggereedschap', href: '/gereedschap/zaaggereedschap/' },
      { label: 'Hogedrukreiniger', href: '/gereedschap/hogedrukreiniger/' },
      { label: 'Heggenschaar', href: '/gereedschap/heggenschaar/' },
      { label: 'Tuinruimer', href: '/gereedschap/tuinruimer/' },
      { label: 'Grasmaaier', href: '/gereedschap/grasmaaier/' },
      { label: 'Bladblazer', href: '/gereedschap/bladblazer/' },
    ],
  },
  {
    label: 'Overig',
    href: '/overig/',
    children: [
      { label: 'Combisystemen stelen', href: '/overig/combisystemen-stelen/' },
      { label: 'Vochtmeters planten', href: '/overig/vochtmeters-planten/' },
      { label: 'Bodemverwerker', href: '/overig/bodemverwerker/' },
      { label: 'Sneeuwruimers', href: '/overig/sneeuwruimers/' },
      { label: 'Veegmachine', href: '/overig/veegmachine/' },
      { label: 'Plantenzakken', href: '/overig/plantenzakken/' },
      { label: 'Deurklopper', href: '/overig/deurklopper/' },
      { label: 'Wandlamp', href: '/overig/wandlamp/' },
      { label: 'Windgong', href: '/overig/windgong/' },
      { label: 'Tuinkleding', href: '/overig/tuinkleding/' },
    ],
  },
  {
    label: 'Planten & zaden',
    href: '/planten-zaden/',
    children: [
      { label: 'Plantenbescherming', href: '/planten-zaden/plantenbescherming/' },
      { label: 'Zaai Pootgoed', href: '/planten-zaden/zaai-pootgoed/' },
      { label: 'Kamerplanten', href: '/planten-zaden/kamerplanten/' },
      { label: 'Vijverplanten', href: '/planten-zaden/vijverplanten/' },
      { label: 'Tuinplanten', href: '/planten-zaden/tuinplanten/' },
      { label: 'Kruidenzaden', href: '/planten-zaden/kruidenzaden/' },
      { label: 'Groentezaden', href: '/planten-zaden/groentezaden/' },
      { label: 'Bloemzaden', href: '/planten-zaden/bloemzaden/' },
      { label: 'Graszaden', href: '/planten-zaden/graszaden/' },
      { label: 'Bemesting', href: '/planten-zaden/bemesting/' },
    ],
  },
  {
    label: 'Tuingerei',
    href: '/tuingerei/',
    children: [
      { label: 'Buitenmat', href: '/tuingerei/buitenmat/' },
      { label: 'Elektrische barbecue', href: '/tuingerei/elektrische-barbecue/' },
      { label: 'Flexibele tuinslang', href: '/tuingerei/flexibele-tuinslang/' },
      { label: 'Hogedrukreiniger', href: '/tuingerei/hogedrukreiniger/' },
      { label: 'Houten tuinkast', href: '/tuingerei/houten-tuinkast/' },
      { label: 'Opbergbox tuinkussens', href: '/tuingerei/opbergbox-tuinkussens/' },
      { label: 'Parasolhoes', href: '/tuingerei/parasolhoes/' },
      { label: 'Tuinhuisje met overkapping', href: '/tuingerei/tuinhuisje-met-overkapping/' },
      { label: 'Tuinmeubelbeschermers', href: '/tuingerei/tuinmeubelbeschermers/' },
      { label: 'Tuinstoel', href: '/tuingerei/tuinstoel/' },
    ],
  },
  {
    label: 'Verbouwing',
    href: '/verbouwing/',
    children: [
      { label: 'Garagedeuropener', href: '/verbouwing/garagedeuropener/' },
      { label: 'Containerombouw', href: '/verbouwing/containerombouw/' },
      { label: 'Schuttingdeur', href: '/verbouwing/schuttingdeur/' },
      { label: 'Vijveronderhoud', href: '/verbouwing/vijveronderhoud/' },
      { label: 'Schuttingpalen', href: '/verbouwing/schuttingpalen/' },
      { label: 'Afrasteringen', href: '/verbouwing/afrasteringen/' },
      { label: 'Tuinafdakje', href: '/verbouwing/tuinafdakje/' },
      { label: 'Tuinhuisje', href: '/verbouwing/tuinhuisje/' },
      { label: 'Tuinkasten', href: '/verbouwing/tuinkasten/' },
      { label: 'Schutting', href: '/verbouwing/schutting/' },
    ],
  },
  { label: 'Blog', href: '/blog/' },
];

export const footerLocations = [
  'Dordrecht', 'Drunen', 'Duiven', 'Haarlem', 'Hoogeveen',
  'Rotterdam', 'Tiel', 'Utrecht', 'Witmarsum', 'Zwolle',
];

export const footerTuincentra = [
  { label: 'Avri Bloem- en Tuincentrum', href: '/tuincentrum/' },
  { label: 'Botanicus Hoveniers', href: '/tuincentrum/' },
  { label: 'Grashandel.nl', href: '/tuincentrum/' },
  { label: 'Groenrijk Tilburg', href: '/tuincentrum/tilburg/' },
  { label: 'Hardenberg', href: '/tuincentrum/hardenberg/' },
  { label: 'Hot Pots', href: '/tuincentrum/' },
  { label: 'Kwekerij de Wilgen', href: '/tuincentrum/' },
  { label: 'Oosterhout', href: '/tuincentrum/oosterhout/' },
  { label: 'Overvecht Almere', href: '/tuincentrum/almere/' },
  { label: 'Welkoop Aalsmeer', href: '/tuincentrum/' },
  { label: 'Kwekerij de Ent', href: '/tuincentrum/' },
];

export const footerReviews = [
  { label: 'Decoratie', href: '/decoratie/' },
  { label: 'Gereedschap', href: '/gereedschap/' },
  { label: 'Overig', href: '/overig/' },
  { label: 'Planten & Zaden', href: '/planten-zaden/' },
  { label: 'Tuingerei', href: '/tuingerei/' },
  { label: 'Verbouwing', href: '/verbouwing/' },
];

export const footerPlanten = [
  { label: 'Calathea Duo', href: '/planten/' },
  { label: 'Dracaena Marganita', href: '/planten/' },
  { label: 'Ficus Elastica', href: '/planten/' },
  { label: 'Ginkgo Biloba', href: '/planten/' },
  { label: 'Koffieplant', href: '/planten/' },
  { label: 'Monstera Deliciosa', href: '/planten/' },
  { label: 'Pilea Peperomioides', href: '/planten/' },
  { label: 'Spathiphyllum Torelli', href: '/planten/' },
  { label: 'Strelitzia Reginae', href: '/planten/' },
  { label: 'Yucca Elephantipes', href: '/planten/' },
];
