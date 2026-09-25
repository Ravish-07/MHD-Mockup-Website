/* =====================================================================
   COAST Insurance — Third Party Only Pleasure Craft quote flow (TPCP)

   Built from: HPFE - THIRD PARTY ONLY PLEASURE CRAFT.xlsx
     - TPO PLEASURE CRAFT   -> screens, fields, referral / decline notes
     - TPO DROPDOWNS        -> dropdown lists
     - TPO RATING           -> category, premium, excess and loadings
     - TPO CALCULATIONS     -> calculation order
     - POSTCODE LISTS       -> referred postcode list

   Structure mirrors jet-ski.js: same auth guard, same DEV_BYPASS_VALIDATION
   switch, same goToSection() navigation, same modals (email / referral / decline).
   ===================================================================== */

if (sessionStorage.getItem('coastAuthed') !== 'true') {
  window.location.replace('index.html');
}

document.addEventListener('DOMContentLoaded', () => {

  // Same switch as jet-ski.js: true = Continue buttons are never blocked by validation.
  // Decline / referral rules still run when this is true.
  const DEV_BYPASS_VALIDATION = true;

  const progressBar = document.getElementById('progressBar');
  const totalProgressSteps = 7; // intro screen is NOT counted
  let currentSectionNum = 1;    // maps to section id="tp-step-N"

  // ---------- HELPERS ----------
  const $ = id => document.getElementById(id);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => (
    {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]
  ));
  const money = n => '$' + Number(n || 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const round2 = n => Math.round((n + Number.EPSILON) * 100) / 100;
  const clone = o => JSON.parse(JSON.stringify(o));
  const pad = n => String(n).padStart(2, '0');
  const toInputDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseDate = s => {
    if (!s) return null;
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  const formatDate = s => {
    if (!s) return '';
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
  };
  const addMonths = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };
  const startOfToday = () => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); };
  const optionNumber = v => (v === '5+' ? 5 : (v === '' || v == null ? NaN : Number(v)));
  const ci = (list, value) => list.some(x => x.toLowerCase() === String(value ?? '').trim().toLowerCase());

  function formatCurrencyInput(input) {
    const digits = input.value.replace(/\D/g, '');
    input.value = digits ? '$' + Number(digits).toLocaleString('en-AU') : '';
  }

  // ---------- RULES / LISTS (from the workbook) ----------

  // Hull Make dropdown (TPO DROPDOWNS sheet)
  const HULL_MAKES = [
    "29er", "49er", "Ab Inflatables", "Absolute", "Ac Barber Design", "Ac Marine", "Academy", "Achilles",
    "Action Craft", "Adams", "Adams Marine", "Adria", "Adventure Yachts", "Aicon", "Air Rider", "Al Dhaen",
    "Alan Payne", "Alaska", "Albo Marine", "Alden", "Alf Stessl", "Allison", "Allseas Yachts", "Ally Craft",
    "Aloha", "Alubat", "Alucraft", "Aluminium Longboats", "Aluvan", "Amanda", "Amara Boats", "Amel",
    "Amphibious", "Angel", "Anglapro", "Apex", "Apreamare", "Aqualine", "Aquamaster", "Aquapro", "Aquarius",
    "Aquascape", "Aquasport", "Aquavan", "Aquila", "Archambault", "Archer", "Arrowcat", "Arvor", "Asi",
    "Assassin", "Atkinson", "Atlas Boat Works Usa", "Atlas Boats", "Atomix", "Aurora", "Ausboating",
    "Aussie Whaler", "Austral", "Austral Marine", "Australian Marine", "Aventura Catamarans", "Axis By Malibu",
    "Axopar", "Azimut", "Aztecraft", "Azuree", "Azzura", "Back Cove", "Bahama", "Baia", "Baja", "Bakewell-White",
    "Bakri Cono", "Baldwin Boats", "Bali Catamarans", "Bancroft Bay", "Bar Crusher", "Baron", "Baroness",
    "Barrington", "Bass Boat", "Bass Strait", "Bateau", "Bavaria", "Bay Cruiser", "Bayliner", "Baysport",
    "Beachcraft", "Beastmaster Boats", "Belize", "Bella", "Bellboy", "Belvedere", "Beneteau", "Benetti",
    "Bennington", "Bering", "Bermuda", "Bernico", "Bertram", "Bertram Caribbean", "Bfg", "Bg Boatbuilding",
    "Big Duck", "Bill Fisher", "Bingstar", "Black Watch", "Blackdog Cat", "Blackfin Boats", "Blue Seas",
    "Blue Water", "Bluefin", "Blueline", "Boat A Home", "Bonbridge", "Bonito", "Boomerang", "Boro",
    "Boston Whaler", "Botin & Carkeek", "Boyer", "Brabus Marine", "Brady", "Brewer", "Brig", "Brinovo", "Brolga",
    "Brooker", "Broward", "Brown Brothers", "Bruce Harris", "Bruce Roberts", "Buccaneer", "Buizen", "Bullet",
    "Cabo", "Cairns Custom Craft", "Calabria", "Calibre", "Camcraft", "Camero", "Campion",
    "Cantiere Delle Marche", "Cantieri Di Pisa", "Cantieri Di Sarnico", "Cantieri Magazzu", "Cape", "Capelli",
    "Caporn", "Caravelle", "Carbineer", "Careel", "Carey", "Caribbean", "Caribbean Bertram", "Carolina Classic",
    "Carrera", "Carter", "Carvel", "Carver Yachts", "Catalina Yachts", "Catana", "Catathai", "Cavalier",
    "Cayzer", "Cdmarine", "Celebrity", "Centurion", "Century", "Chadwick Boats", "Chamberlin", "Chaparral",
    "Charter", "Cheoy Lee", "Chivers", "Chivers Marine", "Chris Craft", "Cigarette", "Circa", "Clansman",
    "Clark", "Clarke", "Classic", "Clayton", "Cleveland", "Clinker", "Clipper", "Cnb Yachts", "Cnc Marine",
    "Coastal Cat", "Coaster", "Cobalt", "Cobia", "Coher", "Cole", "Colin Smith", "Colombo Yachts", "Columbia",
    "Colvin (Thomas Colvin)", "Comet", "Commodo", "Com-Pac", "Compass", "Concept", "Conquest", "Contender",
    "Contest Yachts", "Cooke Nz", "Cooke Yachts", "Cookson", "Cooper", "Cootacraft", "Coral Coast", "Coraline",
    "Corby", "Coronado", "Coronet", "Couach", "Cougar", "Court", "Couta Boat", "Coxcraft", "Cranchi",
    "Creelcraft", "Crest Pontoons", "Cresta", "Crestliner", "Crestrida", "Crestrunner", "Cross X Country",
    "Crossfire", "Crowley", "Crownline", "Crowther", "Cruise Craft", "Cruisers Yachts", "Crusader", "Current",
    "Cutter", "Cyclone", "Dan Leech", "David Young", "Davidson", "Daydream", "De Antonio Yachts", "De Havilland",
    "Deep V", "Defever", "Dehler", "Deltabay", "Dennis", "Devilcat", "Diamond", "Dk Yachts",
    "DNA Performance Sailing", "Dominator", "Don Brooke", "Donzi", "Dorado", "Doral", "Dovell", "Doven",
    "Dragon", "Dragonfly", "Dreamcatcher", "Dromeas Yachts", "Dubois", "Duck Flat Wooden Boats", "Dufour Yachts",
    "Duncanson", "Dyna", "Dynamic", "Dynamiq", "Eagle Catamarans", "Eastcoast", "Easy Rider", "Ebbtide",
    "Ed Monk", "Edencraft", "Edgewater", "Elan", "Elliott", "Endeavour", "Endurance", "Enlightened Boating",
    "Enterprise", "Epic", "Etchells", "Everglades", "Everingham", "Evo", "Evo Yachts", "Evolution",
    "Excess Catamarans", "Expedition", "Explorer", "Express", "Extreme", "Fairline", "Fairway", "Falcon",
    "Falmouth", "Far North Fabrication", "Fareast", "Farr", "Farrier", "Fast", "Fastback", "Fastlane",
    "Feadship", "Feathercraft", "Ferretti", "Ferry", "Fibrafort", "Fibremaster", "Fi-Glass", "Filam Ski Boats",
    "Fine Entry", "Finn", "Fisher", "Fjord", "Fleming", "Flightcraft", "Flipper Boats", "Flying Fifteen",
    "Flying Tiger", "Focus Motor Yachts", "Folkboat", "Force", "Formosa", "Formula", "Foundation",
    "Fountaine Pajot", "Four Seasons", "Four Winns", "Fraser", "Frauscher", "Fred Fleming", "Freedom",
    "Freeman Bay", "Fury", "Fusion", "G Boats", "G&S Boats", "Gaff Rigged", "Galeon Yachts", "Ganley", "Garcia",
    "Garnet Boats", "Gavin Mair", "Gbb", "GEM", "Gemini", "Geta", "Gilbert Caroff", "Gilcraft", "Gilflite",
    "Glacier Bay", "Glastron", "Glen L Marine", "Global Marine", "Gold Coast Ships", "Gold Island", "Goldstar",
    "Goolwacraft", "Gospel", "Gozzo Schiaffino", "Gp Engineering", "Gr Pontoon", "Grady-White", "Grainger",
    "Grand Banks", "Grand Soleil", "Greenline", "Greg Young", "Griffin", "Gulf Craft", "Gulfstar", "Gunfleet",
    "Gunner Cardell", "Guy Couach", "Haines", "Hallberg-Rassy", "Hallett", "Halvorsen", "Hammerhead", "Hampton",
    "Hankinson", "Hans Christian", "Hanse", "Haoyun", "Hargrave", "Harold Springs", "Harris", "Harriscraft",
    "Hartley", "Hatteras", "Havana", "Hcb Yachts", "Heesen Yachts", "Heliotrope", "Herreshoff", "Hershine",
    "Hewes", "Heysea", "Hi Star", "High Seas", "Highfield", "Hoek", "Holland", "Holman", "Holmes", "Homecruiser",
    "Hooker", "Horace Tate", "Horizon", "Horizon Yacht", "Hugh Morris", "Humphreys Yacht Design",
    "Hunter Marine", "Hunter Yachts", "Huntsman", "Hurricane", "Hutton", "Hydra Cat", "Hydra-Sports",
    "Hydrofield", "Hydrotec", "Hylas", "ILCA", "Illusions", "Iluka Yachts", "Image", "Imexus", "IMP", "Inace",
    "Incat Crowther", "Inglis", "Integrity", "International", "International Cadet", "Intrepid",
    "Invincible Boats", "Island Gypsy", "Island Inflatables", "Island Packet", "Island Spirit Catamaran",
    "Islander", "Italboats", "Italia Yachts", "Itama", "J Boats", "Jackaroo", "Jackman", "Jade Yachts", "Jarkan",
    "Javelin", "Jbs Marine", "Jeanneau", "Jemison Motor Yacht", "Jenks Craft", "John Dengate", "John Pugh",
    "Joker Boat", "Jomo Boats", "Jp Marine", "Jpk Pacific", "Kaizen", "Kaos", "Kellick", "Kelsall", "Ker",
    "Kevlacat", "Key West", "Kingcat", "Kingfisher", "Kingship", "Kingston", "Kinocean", "Kiwi Kraft", "Kleise",
    "Kong Halvorsen", "Koolyn", "Koster", "Kuipers Doggersbank", "Kwikkraft", "Lagoon", "Laguna", "Lancer",
    "Larc", "Larson", "Laser", "Laurent Giles", "Lazzara", "Lct", "Leeder", "Legend Boats", "Leisurecat",
    "Leonardo Yachts", "Leopard", "Leopard Catamarans", "Lewis", "Lidgard", "Lightwave", "Lightwave Yachts",
    "Liya", "Lloyd", "Lomac", "Longreef Yachts", "Lou Farrell", "Ltn", "Luhrs", "Lyndcraft", "Lyons",
    "Mac Boats", "MacGregor", "Mackay Boats", "Mad Dog Boats", "Magnum", "Maiora", "Majesty Yachts", "Mako",
    "Makocraft", "Malibu", "Mancraft", "Mangrove Jack", "Mangusta", "Manitou", "Manta", "Marauder", "Marex",
    "Mariah", "Mariner", "Maritimo", "Mark Ellis Design", "Markham", "Markham Whaler", "Markline", "Marko",
    "Marlin", "Marlin Broadbill", "Marquis", "Marshall Lord", "Marten", "Masrm", "Mastercraft", "Matrix",
    "Maurice Griffiths", "Maverick", "Maxum", "Mcalpine Marine Design", "Mcconaghy", "Mclay", "Mec",
    "Mediterranean", "Melges", "Mercury", "Meridian", "Mg", "Midland Marine", "Miller And Whitworth",
    "Millkraft", "Millman", "Minnow", "Mirror", "Misty Harbor", "Moby", "Mochi Craft", "Moda", "Monark",
    "Monte Carlo", "Monte Fino", "Monterey", "Moody", "Moomba", "Moonen", "Moreton", "Morningstar",
    "Morrelli & Melvin", "Motor Guide", "Mottle", "Murray Burns & Dovell", "Mustang", "Naiad", "Nankervis",
    "Nantucket", "Nautica", "Nauticat", "Nauticstar Usa", "Nautiglass", "Nautique", "Nautitech", "Nautor Swan",
    "Navigator", "Naya", "Neel Trimarans", "Nereus", "Nesscraft", "New Ocean Yachts", "New Zealand Plate Boats",
    "New Zealand Yachts", "Newport", "Nimbus", "Nitro", "Noelex", "Nomad Yachts", "Noosa Cat", "Nordhavn",
    "Nordic", "Norman Wright", "North Harbour Motor Yachts", "Northbank", "Northern Star", "Northshore",
    "Norwalk Islands Sharpies", "Novamarine", "Novatec", "Novurania", "Nq Borger Cat", "Numarine", "Nuova Jolly",
    "O'Brien", "OC", "Ocean Alexander", "Ocean Cylinder", "Ocean Master", "Ocean Max", "Ocean Voyager",
    "Ocean Whaler", "Ocean Yachts", "Oceaneer", "Oceanic", "Oceantech", "Offshore", "Offshore NZ", "OK Dinghy",
    "O'PEN", "Optimist", "Oram", "Origin", "Orion", "Oromarine", "Oryx Yachts", "Outlaw", "Outremer", "Ovington",
    "Owens", "Ozycat", "Pacemaker", "Pachoud", "Pacific", "Pacific Pontoons", "Pacific Sportfish",
    "Palm Beach Motor Yachts", "Pan Oceanic", "Panorama", "Paragon", "Pardo Yachts", "Parker", "Pathfinder",
    "Pearl Yachts", "Pegasus", "Pegiva", "Penguin", "Performance Plate Boats", "Perry", "Pershing", "Pescott",
    "Peter Milner", "Phantom", "Phibicat", "Phil Curran", "Pioneer", "Pirate", "Pirelli Pzero",
    "Pirelli Tecnorib", "Platemaster", "Pleysier", "Polar Kraft", "Polycraft", "Pompei", "Pongrass",
    "Porta-Bote", "Post", "PowerCat Marine", "Powercraft", "Precision", "Predator", "Premier", "President",
    "Prestige", "Preston", "Preston Craft", "Pride", "Princess", "Privilege", "Pro Plate Boats", "Proceans",
    "Pro-Line", "Protector", "Prout", "Puccini Yachts", "Purekraft Boats", "Pursuit", "Qingdao", "Quantum Cat",
    "Quarken", "Queens", "Quicksilver", "Quicksilver Inflatables", "Quintrex", "Radar", "Radford", "Rae Line",
    "Rafnar", "Ramco", "Rampage", "Ramsay", "Rand Boats", "Randall", "Randell", "Ranger", "Ranger Tugs",
    "Ranieri", "Raptor", "Rayglass", "Raymond Hunt Design", "Razerline", "Rebel Boats", "Redfin", "Redline",
    "Reflex", "Regal", "Regent", "Regulator", "Reichel Pugh", "Reinell", "Rencraft", "Renken", "Revival",
    "Rex Norton", "Rhea", "RIB Force", "Ribbon", "Richmond", "Rinker", "Rip Tide", "Riva", "Riviera", "Rizzardi",
    "Robalo", "Robert Clarke", "Roberts", "Robertson", "Roger Hill", "Rolco", "Ross", "Roughneck",
    "Royal Denship", "RS Sailing", "Runnalls", "Sable Marine", "Sabre", "Sacs Marine", "Saga Yachts", "Sailfish",
    "Salacia Yachts", "Salar", "Salem", "Salona", "Salthouse", "Saltwater Commercial Workboats", "Samson",
    "Sanlorenzo", "Santana", "Sasga Yachts", "Savage", "Saxdor Yachts", "Sbf Shipbuilders", "Scarab", "Schaaf",
    "Schaefer Yachts", "Scheepswerf Van Duivendijk", "Schionning", "Schock", "Scimitar", "Scorpion",
    "Scott Robson", "Scout", "Scruffie", "Sea Austral", "Sea Cat", "Sea Change Boating", "Sea Chaser",
    "Sea Crest", "Sea Dogger", "Sea Flight", "Sea Fox", "Sea Hunter", "Sea Jay", "Sea Pro", "Sea Ranger",
    "Sea Ray", "Sea Storm", "Sea Tiger", "Seabreeze", "Seacraft", "Seacruiser", "Sea-Doo", "Seafarer",
    "Seahorse", "Seaking", "Sealegs", "Sealine", "Sealver", "Seamaster", "Seaquest", "Seascape", "Seaswirl",
    "Seatamer", "Seatech", "Seatime", "Seaview", "Seawind", "Seeker Pontoon Boats", "Selene", "Senator",
    "Sensation", "Sessa", "Shamrock", "Shark Cat", "Sharkcat", "Sharpie", "Shepirocraft", "Silent Yachts",
    "Silver Arrows Marine", "Silvercraft", "Silverline", "Silverton", "Simonis", "Simpson", "Sirena Yachts",
    "Sirocco", "Skater", "Skeeter", "Ski Hi", "Skibsplast", "Skicraft", "Skiline", "Sleekline", "Slockscraft",
    "Smartwave", "Smuggler", "Snyper", "Solaris", "Solaris Power", "Sonata", "Sossego", "South Coast",
    "South Pacific", "Southbound Boats", "Southerly", "Southern Cross", "Southern Formula", "Southern Pacific",
    "Southern Star", "Southland", "Southwind", "Sovereign", "Spacesailer", "Sparkman & Stephens", "Spearfish",
    "Spirited", "Sportcraft", "Sportscraft", "Sportsman", "Sportsman Boats", "Sportsman Craft", "Spy Boats",
    "Spydercraft", "Stabicraft", "Stacer", "Stagg", "Star Boats", "Starcraft", "Stealth", "Steber",
    "Stebercraft", "Stejcraft", "Stephens", "Stessco", "Stessl", "Steve Ward", "Stevens", "Stingray",
    "Stoner Boatworks", "Strategic Marine", "Stratos", "Streaker", "Streamline Catamarans", "Striker",
    "Success Craft", "Sun Tracker", "Sun Yachts", "Sunbird", "Sunchaser", "Sundance", "Sunliner Boats",
    "SunQuest Boats Australia", "Sunreef Yachts", "Sunrunner", "Sunsation", "Sunseeker", "Super Cat",
    "Super Trac", "Supra", "Supreme", "Sur Marine", "Surtees", "Swanson", "Swarbrick", "Swarbrick & Swarbrick",
    "Sweetwater", "Swift Craft", "Sydney", "Sydney Yachts", "Symbol", "Tabs", "Tahoe", "Tailored Marine",
    "Taipan", "Takacat", "Talamex", "Tasmanian", "Tayana", "Taylor", "Te Cat", "Technohull", "Telwater",
    "Temptress", "Tennessee", "Terrara", "Thomascraft", "Thompson", "Tiara", "Tidal Marine", "Tidewater", "Tige",
    "Tiger Marine", "Timpenny", "Titan", "Tofinou", "Top Hat", "Topaz", "Topper", "Tornado", "Tournament", "Tp",
    "Tracker", "Traditional", "Trailcraft", "Trailer", "Trekka", "Tri Star", "Trident", "Trinity Yachts",
    "Triumph", "Trophy", "Tumlaren", "Turncraft", "UFO", "Ultimate", "Universal", "Valhalla", "Van De Stadt",
    "Van Dieman Seaman", "Van Diemen Luxury Craft", "Vancouver", "Vandutch", "Vanquish Yachts", "Vasard",
    "Veitch", "Venom", "Veranda Pontoons", "Versilcraft", "Vickers", "Viking Boats", "Viking Yachts", "Vmax",
    "Volvo", "Voyager", "Wade Craft", "Walker", "Warren", "Warwick", "Waszp", "Watermark Marine", "Wauquiez",
    "Wavelength", "Websters Twinfisher", "Wellcraft", "Wells", "Wescraft", "Westcoaster", "Westerberg",
    "Westport", "Whisper Boats", "White Cap", "White Pointer", "Whitehaven", "Whittley", "Wider", "Wildsea",
    "William Atkins", "William Fife", "Williams", "Wilson", "Windrush", "Woody Marine", "Woollacott",
    "World Cat", "Xcat", "Xfi", "Xo Boats", "Xpress Boats", "Xpression", "Xtreme Marine", "X-Yachts", "Y Yachts",
    "Yalta", "Yalta Craft", "Yamaha Boats", "Yamba", "Yanmar", "Yeld Cat Marine", "Yellowfin", "Young",
    "Young Craft", "Zar Formenti", "Zar Mini", "Zego", "Zenith", "Ziegelmayer", "Zodiac", "Zodiac Milpro",
    "Zulu Cat", "Other"
  ];

  // Referred Postcode List (POSTCODE LISTS sheet) - risk located here = Referral
  const REFERRAL_POSTCODES = new Set([
    "0800", "0801", "0804", "0810", "0811", "0812", "0813", "0814", "0815", "0820", "0821", "0822", "0828",
    "0829", "0830", "0831", "0832", "0834", "0835", "0836", "0837", "0838", "0839", "0840", "0841", "0845",
    "0846", "0847", "0850", "0851", "0852", "0853", "0854", "0860", "0861", "0862", "0870", "0871", "0872",
    "0873", "0874", "0875", "0880", "0881", "0885", "0886", "0906", "0907", "2540", "0909", "4003", "4004",
    "4108", "4110", "4420", "4454", "4465", "4467", "4470", "4472", "4474", "4477", "4478", "4481", "4482",
    "4510", "4580", "4581", "4620", "4621", "4625", "4626", "4627", "4630", "4650", "4655", "4659", "4660",
    "4662", "4670", "4671", "4673", "4674", "4676", "4677", "4678", "4680", "4694", "4695", "4697", "4699",
    "4700", "4701", "4702", "4703", "4704", "4705", "4706", "4707", "4709", "4710", "4711", "4712", "4713",
    "4714", "4715", "4716", "4717", "4718", "4719", "4720", "4721", "4722", "4723", "4724", "4725", "4726",
    "4727", "4728", "4730", "4731", "4732", "4733", "4735", "4736", "4737", "4738", "4739", "4740", "4741",
    "4742", "4743", "4744", "4745", "4746", "4750", "4751", "4753", "4754", "4756", "4757", "4798", "4799",
    "4800", "4801", "4802", "4803", "4804", "4805", "4806", "4807", "4808", "4809", "4810", "4811", "4812",
    "4813", "4814", "4815", "4816", "4817", "4818", "4819", "4820", "4821", "4822", "4823", "4824", "4825",
    "4828", "4829", "4830", "4849", "4850", "4852", "4854", "4855", "4856", "4857", "4858", "4859", "4860",
    "4861", "4865", "4868", "4869", "4870", "4871", "4872", "4873", "4874", "4875", "4876", "4877", "4878",
    "4879", "4880", "4881", "4882", "4883", "4884", "4885", "4886", "4887", "4888", "4890", "4891", "4892",
    "4895", "6168", "6537", "6642", "6646", "6701", "6705", "6707", "6710", "6711", "6712", "6713", "6714",
    "6716", "6718", "6720", "6721", "6722", "6723", "6725", "6726", "6728", "6731", "6733", "6740", "6743",
    "6751", "6753", "6754", "6758", "6760", "6761", "6762", "6765", "6770", "6798", "6799"
  ]);

  const SPEED_OPTIONS = [
    'Up to 40 Knots / 75 kph',
    '40-60 Knots / 75-110 kph',
    'Over 60 Knots / 110 kph'
  ];

  const HULL_MAKES_REFER = [
    'Al Dhaen', 'Amphibious', 'Boat A Home', 'Dragon', 'Farrier', 'Halvorsen', 'Homecruiser',
    'Kong Halvorsen', 'Markham', 'Neel Trimarans', 'Scarab', 'Westcoaster'
  ];

  const HULL_CONSTRUCTION = [
    'Aluminium', 'Carbon Fibre', 'Ferrocement', 'Fibreglass', 'Kevlar', 'Plastic',
    'Plywood', 'Rubber', 'Steel', 'Timber', 'Other/Composite'
  ];
  const HULL_CONSTRUCTION_REFER = ['Other/Composite', 'Ferrocement'];

  const HULL_TYPES = [
    'Cabin Cruiser', 'Catamaran POWER', 'Catamaran SAILING', 'Centre Console', 'Ex Cray Fishing Boat',
    'Flybridge Cruiser', 'Half Cabin Cruiser', 'Houseboat', 'Jet Boat', 'Monohull Motor Yacht',
    'Monohull Sailing Yacht', 'Pontoon Boat', 'Rigid Inflatable', 'Runabout', 'Sailing Dinghy / Skiff',
    'Ski Boat', 'Sports Cruiser', 'Trimaran', 'Other'
  ];
  const HULL_TYPES_REFER = ['Ex Cray Fishing Boat', 'Houseboat', 'Jet Boat', 'Trimaran'];
  const SAILING_TYPES = ['Catamaran SAILING', 'Monohull Sailing Yacht', 'Sailing Dinghy / Skiff', 'Other'];

  const MAST_CONSTRUCTION = ['Aluminium', 'Carbon Fibre', 'Fibreglass', 'Timber', 'Other'];
  const RIGGING_TYPES = ['Carbon Fibre', 'Rod', 'Wire / Stainless Steel', 'Other'];

  const NUMBER_OF_MOTORS = ['0', '1', '2', '3', '4', '5+'];
  const NUMBER_OF_MOTORS_REFER = ['3', '4', '5+'];

  const MOTOR_MAKES = [
    'NO MOTOR', 'Beta', 'BMW', 'Bombardier', 'Caterpillar', 'Chevrolet', 'Chrysler', 'Cummins', 'Detroit',
    'Drofin', 'Evinrude', 'Ford', 'Ford Lehman', 'Gardner', 'Holden', 'Honda', 'Ilmor', 'Indmar', 'Isuzu',
    'Iveco', 'John Deere', 'Johnson', 'Kubota', 'MAN', 'Mariner', 'Mercedes-Benz', 'MerCruiser', 'Mercury',
    'Minn Kota', 'Monsoon', 'MTU', 'Nanni', 'Nissan', 'Parsun', 'PCM', 'Perkins', 'Rotax', 'Scania', 'Sole',
    'Steyr', 'Suzuki', 'Tohatsu', 'Torqeedo', 'Universal', 'Volkswagen', 'Volvo Penta', 'Watersnake',
    'Westerbeke', 'Yamaha', 'Yanmar', 'Other'
  ];
  const MOTOR_MAKES_REFER = ['BMW', 'Chevrolet', 'Chrysler', 'Ford', 'Holden', 'Mercedes-Benz', 'Nissan', 'Volkswagen'];

  const MOTOR_TYPES = [
    'NO MOTOR', 'Outboard Electric', 'Outboard Petrol', 'Sterndrive Petrol', 'Inboard Petrol',
    'Jet Drive Petrol', 'Sterndrive Diesel', 'Inboard Diesel', 'Jet Drive Diesel', 'Other'
  ];
  // Named ranges on TPO DROPDOWNS
  const CAT1_MOTORS = ['No Motor', 'Outboard Electric', 'Outboard Petrol'];
  const REFER_MOTORS = ['Sterndrive Petrol', 'Inboard Petrol', 'Jet Drive Petrol', 'Other'];

  const STORAGE_METHODS = [
    'Trailer - Garage / Shed', 'Trailer - Behind Locked Gates', 'Trailer - Carport / Driveway / Front Lawn',
    'Trailer - Roadside / Verge / Other', 'Hardstand / Rack', 'Private Jetty - Floating Dock',
    'Private Jetty - In Water', 'Marina Berth', 'Fore & Aft / Pile Mooring', 'Swing Mooring', 'Other'
  ];
  const CAT1_STORAGE = [
    'Trailer - Garage / Shed', 'Trailer - Behind Locked Gates', 'Trailer - Carport / Driveway / Front Lawn',
    'Trailer - Roadside / Verge / Other', 'Hardstand / Rack'
  ];
  const STORAGE_REFER = ['Trailer - Roadside / Verge / Other', 'Fore & Aft / Pile Mooring', 'Swing Mooring'];
  // "Under 7.00 m / 23.00 ft + these storage methods = Referral"
  const STORAGE_REFER_UNDER_7M = [
    'Private Jetty - Floating Dock', 'Private Jetty - In Water', 'Marina Berth',
    'Fore & Aft / Pile Mooring', 'Swing Mooring', 'Other'
  ];

  const LIABILITY_LIMITS = [
    { value: '10000000', label: '$10,000,000' },
    { value: '20000000', label: '$20,000,000' }
  ];
  const RACING_OPTIONS = [
    'No',
    'Yes, Racing up to 25 Nautical Miles excluding spinnaker use',
    'Yes, Racing up to 50 Nautical Miles including spinnaker use',
    'Yes, Racing over 50 Nautical Miles'
  ];
  const RACING_REFER = 'Yes, Racing over 50 Nautical Miles';

  const YEARS_OPTIONS = ['0', '1', '2', '3', '4', '5+'];
  const OWNER_SKIPPER_OPTIONS = ['1', '2', '3', '4', '5+'];
  const OWNER_SKIPPER_REFER = ['4', '5+'];

  const STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];

  // ---------- RATING TABLE (TPO RATING sheet) ----------
  const RATING_CATEGORIES = {
    1: { premium: 100,  excess: 250  },
    2: { premium: 300,  excess: 500  },
    3: { premium: 500,  excess: 1000 },
    4: { premium: 700,  excess: 1000 },
    5: { premium: 1000, excess: 1000 }
  };
  const LOADINGS = {
    wreck: 0.30,            // Removal of Wreck
    racing: 0.30,           // Racing Risk
    claimEach: 0.25,        // per claim
    under25Each: 0.20,      // per skipper under 25
    cancelledConvicted: 0.25,
    waterSkiingFlat: 90,    // flat $
    liability20M: 0.20
  };
  const GST_RATE = 0.10;
  const STAMP_DUTY_RATE = 0.10;   // applied to (premium + GST), as per TPO PLEASURE CRAFT sheet
  const ADMIN_FEE = 50;
  const ADMIN_FEE_GST = 5;
  const INSTALMENTS = 10;
  const INSTALMENT_FACTOR = 1.0802;   // total x 1.0802 / 10 (reverse-engineered from sheet: 1281.76 -> 138.46)
  const BROKER_COMMISSION_RATE = 0.20;

  // The sheet lists Category 2 as Experience 0 = OK, 1+ = Refer (Cat 3 & 4 are the other way round).
  // Built exactly as written. Set to false to flip Category 2 to "0 = Refer" if that is a typo.
  const CAT2_EXPERIENCE_AS_WRITTEN = true;

  const CARD_TYPES = [
    { value: 'visa-debit',               label: 'Visa Debit (0.4% transaction fee)',               rate: 0.004 },
    { value: 'visa-credit',              label: 'Visa Credit (1.50% transaction fee)',             rate: 0.015 },
    { value: 'mastercard-debit',         label: 'MasterCard Debit (0.40% transaction fee)',        rate: 0.004 },
    { value: 'mastercard-credit',        label: 'MasterCard Credit (1.2% transaction fee)',        rate: 0.012 },
    { value: 'mastercard-international', label: 'MasterCard International (4.8% transaction fee)', rate: 0.048 },
    { value: 'amex',                     label: 'American Express (1.5% transaction fee)',         rate: 0.015 }
  ];

  const PDS_URL = '#'; // TODO: link to the Third Party Only Pleasure Craft PDS

  // Tooltip copy taken from the cell comments on TPO PLEASURE CRAFT
  const TIP_LIABILITY =
    'We cover You and any person allowed by You to control Your Vessel against Your legal liability to pay compensation for:\n' +
    '• Accidental death or bodily injury to a Third Party,\n' +
    '• Accidental death or bodily injury to You when another person allowed by You is in control of Your Vessel,\n' +
    '• Accidental Damage to Third Party property,\n' +
    '• occurring during the period of insurance and arising out of the ownership or use of Your Vessel.';
  const TIP_WATER_SKIING =
    'If We have agreed to cover You and it is shown in Your Policy Schedule and You have paid any additional Premium We ask for, We will cover:\n' +
    '• You, or\n• any person allowed by You to control Your Vessel, and\n• the person acting as an observer (within the requirements of any law)\n' +
    'against legal liability for:\n' +
    '• Accidental death or bodily injury to a water skier or aquaplaner (including You) towed by Your Vessel,\n' +
    '• Accidental death or bodily injury to any person caused by a water skier or aquaplaner being towed by Your Vessel, or\n' +
    '• Accidental Damage to Third Party property caused by a water skier or aquaplaner being towed by Your Vessel.\n' +
    'We will also cover a water skier or aquaplaner towed by Your Vessel against that water skier’s or aquaplaner’s legal liability for:\n' +
    '• Accidental death or bodily injury to a person, or\n• Accidental Damage to property other than Your Vessel\n' +
    'caused by the water skier or aquaplaner while being towed by Your Vessel.';
  const TIP_RACING =
    'If We have agreed to cover You for yacht racing risks and it is shown in Your Policy Schedule, We will provide additional cover to You for loss of or Damage to Your Vessel, including its’ Sails, Masts, Spars, Standing and Running Rigging, while Your Vessel is being raced in yacht club or association organised races:\n' +
    '• not exceeding the overall distance of the yacht race noted in the Yacht Racing Endorsement shown in Your Policy Schedule, and\n' +
    '• within the geographical limits shown in Your Policy Schedule.';


  // ---------- STATE ----------
  const blankSkipper = () => ({
    name: '', dob: '', licenceDate: '', yearsOwning: '', yearsSizeType: '', previousBoats: ''
  });

  const blankExperience = () => ({
    numOwners: '',
    numSkippers: '',
    skippers: [blankSkipper()],
    past5Years: {},   // cancelledRefused, madeClaims  -> 'yes' | 'no'
    ever: {},         // chargedConvicted, lostLicence -> 'yes' | 'no'
    details: {},      // "Please Specify" text for the Yes answers
    claims: []
  });

  const newVessel = (previous) => ({
    details: { totalSumInsured: 'Third Party Legal Liability Only', hullLengthUnit: 'm' },
    // ADD BOAT: "Experience & History screen to be pre-filled but allow override"
    experience: previous ? clone(previous.experience) : blankExperience(),
    additional: {}
  });

  const todayForNumber = new Date();
  const quoteState = {
    importantInfo: {},
    vessels: [newVessel()],
    activeVessel: 0,
    yourQuote: {
      quoteNumber: `Q-TPO-${String(todayForNumber.getFullYear()).slice(2)}${pad(todayForNumber.getMonth() + 1)}${pad(todayForNumber.getDate())}-001`,
      policyStartDate: '',
      policyEndDate: '',
      wreck: 'not-insured'   // 'not-insured' | '1000000'
    },
    additionalInformation: {
      firstName: '', lastName: '', insuredName: '', email: '', phone: '',
      residentialAddress: '', residentialAddressPostcode: '', residentialAddressManual: false, residentialAddressParts: {},
      postalAddress: '', postalAddressPostcode: '', postalAddressManual: false, postalAddressParts: {},
      interestedParty: '',
      attachments: []
    },
    payment: {
      method: '', cardType: '', cardholderName: '', cardNumber: '', expiryMonth: '', expiryYear: '', ccv: ''
    },
    referral: { required: false, reasons: [] },
    policy: null
  };

  const currentVessel = () => quoteState.vessels[quoteState.activeVessel];

  let referralShownForKey = '';   // stops the referral popup re-opening on every re-render
  let insuredNameManuallyEdited = false;
  let postalAddressManuallyEdited = false;


  // ---------- STEP 2 (progress step 1): TARGET MARKET DETERMINATION ----------
  // onFalse: 'decline' | 'refer'   (notes column on TPO PLEASURE CRAFT)
  const questions = [
    { id: 'q1', type: 'toggle', onFalse: 'decline', text: 'The Vessel(s) will be owned by the applicant/You for the duration of the policy.' },
    { id: 'q2', type: 'toggle', onFalse: 'decline', text: 'The Vessel(s) is not used for financial reward or registered as a commercial vessel.' },
    { id: 'q3', type: 'toggle', onFalse: 'decline', text: 'The Vessel(s) will not operate outside of Australian or New Zealand waters or the waters located between the two countries.' },
    { id: 'q4', type: 'toggle', onFalse: 'decline', text: 'The Vessel(s) will not be under construction (other than being refitted) at any time during the insurance period and the Vessel(s) has been launched.' },
    { id: 'q5', type: 'toggle', onFalse: 'decline', text: 'The Vessel(s) to be insured under this insurance is not registered or zoned as a building (for example, a floating office).' },
    { id: 'q6', type: 'toggle', onFalse: 'refer',   text: 'The Vessel(s) is not used for permanent accommodation (agreement available upon request).' },
    { id: 'q7', type: 'toggle', onFalse: 'decline', text: 'The Vessel(s) is not used for Timeshare Arrangement / Syndicate / Equity Arrangement.' },
    { id: 'q8', type: 'toggle', onFalse: 'decline', text: 'The Vessel(s) is not used for Holiday Rental / Air B&B Holiday Rental / Air B&B.' },
    { id: 'q9', type: 'toggle', onFalse: 'decline', text: 'The Vessel(s) is seaworthy.' },
    {
      id: 'q10', type: 'select', options: SPEED_OPTIONS, declineValue: 'Over 60 Knots / 110 kph',
      text: 'What is the maximum capable speed of the Vessel(s)? Please answer in regards to the fastest Vessel if applying to insure more than one.'
    }
  ];

  function renderQuestions() {
    const list = $('questionList');

    list.innerHTML = questions.map(q => {
      const answer = quoteState.importantInfo[q.id];
      if (q.type === 'select') {
        return `
          <div class="question-row" data-qid="${q.id}">
            <p class="question-text">${esc(q.text)}</p>
            <select class="question-select" data-qid="${q.id}">
              <option value="" disabled ${answer ? '' : 'selected'}>Select</option>
              ${q.options.map(o => `<option value="${esc(o)}" ${answer === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}
            </select>
          </div>`;
      }
      return `
        <div class="question-row" data-qid="${q.id}">
          <p class="question-text">${esc(q.text)}</p>
          <div class="question-toggle">
            <button type="button" class="toggle-btn ${answer === 'true' ? 'selected' : ''}" data-value="true">True</button>
            <button type="button" class="toggle-btn ${answer === 'false' ? 'selected' : ''}" data-value="false">False</button>
          </div>
        </div>`;
    }).join('');

    list.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const row = btn.closest('.question-row');
        row.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        quoteState.importantInfo[row.dataset.qid] = btn.dataset.value;
        checkStep2Complete();
      });
    });

    list.querySelectorAll('.question-select').forEach(select => {
      select.addEventListener('change', () => {
        quoteState.importantInfo[select.dataset.qid] = select.value;
        checkStep2Complete();
      });
    });
  }

  function checkStep2Complete() {
    if (DEV_BYPASS_VALIDATION) {
      $('continueStep2Btn').disabled = false;
      return;
    }
    const answered = Object.keys(quoteState.importantInfo).length;
    $('continueStep2Btn').disabled = answered < questions.length;
  }

  // Decline triggers (workbook: "False = Decline", "Over 60 Knots = Decline")
  function getDeclineReasons() {
    const reasons = [];
    questions.forEach(q => {
      const answer = quoteState.importantInfo[q.id];
      if (q.type === 'toggle' && q.onFalse === 'decline' && answer === 'false') {
        reasons.push(q.text);
      }
      if (q.type === 'select' && answer === q.declineValue) {
        reasons.push(`Maximum speed: ${q.declineValue}`);
      }
    });
    return reasons;
  }


  // ---------- ADDRESS FIELD (lookup or manual entry) ----------
  // The workbook asks for "Improved Address Lookup" with an "Enter Address Manually" option.
  // The lookup input is a plain text field for now - plug an address API into
  // [data-addr-lookup] when one is chosen. The postcode is read from the end of the address.

  const extractPostcode = text => {
    const m = String(text || '').match(/\b(\d{4})\b(?!.*\b\d{4}\b)/);
    return m ? m[1] : '';
  };

  const composeAddress = p =>
    [p.street, [p.suburb, p.state, p.postcode].filter(Boolean).join(' ')].filter(Boolean).join(', ');

  function addressHtml(key, store, placeholder = 'Start typing address...') {
    const manual = !!store[`${key}Manual`];
    const p = store[`${key}Parts`] || {};
    return `
      <div class="address-field" data-address="${key}">
        <div class="address-lookup-wrap" style="${manual ? 'display:none;' : ''}">
          <input type="text" data-addr-lookup autocomplete="off"
                 placeholder="${esc(placeholder)}" value="${esc(manual ? '' : (store[key] || ''))}">
        </div>
        <div class="address-manual" style="${manual ? '' : 'display:none;'}">
          <input type="text" data-addr-part="street" placeholder="Street address" value="${esc(p.street)}">
          <input type="text" data-addr-part="suburb" placeholder="Suburb" value="${esc(p.suburb)}">
          <select data-addr-part="state">
            <option value="" disabled ${p.state ? '' : 'selected'}>State</option>
            ${STATES.map(s => `<option value="${s}" ${p.state === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
          <input type="text" data-addr-part="postcode" inputmode="numeric" maxlength="4" placeholder="Postcode" value="${esc(p.postcode)}">
        </div>
        <button type="button" class="link-btn" data-addr-toggle>
          ${manual ? 'Search for an address instead' : 'Enter address manually'}
        </button>
      </div>`;
  }

  function bindAddress(host, getStore, onChange) {
    const handle = e => {
      const wrap = e.target.closest('[data-address]');
      if (!wrap) return;
      const key = wrap.dataset.address;
      const store = getStore(key);
      if (!store) return;

      if (e.target.matches('[data-addr-lookup]')) {
        store[key] = e.target.value;
        store[`${key}Postcode`] = extractPostcode(e.target.value);
      } else if (e.target.matches('[data-addr-part]')) {
        const parts = store[`${key}Parts`] = store[`${key}Parts`] || {};
        parts[e.target.dataset.addrPart] = e.target.value;
        store[key] = composeAddress(parts);
        store[`${key}Postcode`] = parts.postcode || '';
      } else {
        return;
      }
      onChange(key, store);
    };

    host.addEventListener('input', handle);
    host.addEventListener('change', handle);

    host.addEventListener('click', e => {
      const btn = e.target.closest('[data-addr-toggle]');
      if (!btn) return;
      const wrap = btn.closest('[data-address]');
      const key = wrap.dataset.address;
      const store = getStore(key);
      const manual = !store[`${key}Manual`];
      store[`${key}Manual`] = manual;

      wrap.querySelector('.address-lookup-wrap').style.display = manual ? 'none' : '';
      wrap.querySelector('.address-manual').style.display = manual ? '' : 'none';
      btn.textContent = manual ? 'Search for an address instead' : 'Enter address manually';

      if (manual) {
        const parts = store[`${key}Parts`] = store[`${key}Parts`] || {};
        store[key] = composeAddress(parts);
        store[`${key}Postcode`] = parts.postcode || '';
      } else {
        const lookup = wrap.querySelector('[data-addr-lookup]').value;
        store[key] = lookup;
        store[`${key}Postcode`] = extractPostcode(lookup);
      }
      onChange(key, store);
    });
  }



  // ---------- STEP 3 (progress step 2): VESSEL DETAILS ----------
  const isSailing = d => SAILING_TYPES.includes(d.hullType);

  const vesselFields = [
    { id: 'hullMake', label: 'Hull Make', type: 'select', options: HULL_MAKES, specifyOn: ['Other'] },
    { id: 'hullModel', label: 'Hull Model', type: 'text' },
    { id: 'hullYearBuilt', label: 'Hull Year Built', type: 'year' },
    { id: 'hullConstruction', label: 'Hull Construction', type: 'select', options: HULL_CONSTRUCTION, specifyOn: ['Other/Composite'] },
    { id: 'hullLength', label: 'Length', type: 'length' },
    { id: 'hullType', label: 'Hull Type', type: 'select', options: HULL_TYPES, specifyOn: ['Other'] },
    { id: 'mastConstruction', label: 'Mast Construction', type: 'select', options: MAST_CONSTRUCTION, specifyOn: ['Other'], showIf: isSailing },
    { id: 'numMotors', label: 'Number of Motors', type: 'select', options: NUMBER_OF_MOTORS },
    { id: 'motorMake', label: 'Motor Make', type: 'select', options: MOTOR_MAKES, specifyOn: ['Other'] },
    { id: 'motorType', label: 'Motor Type', type: 'select', options: MOTOR_TYPES, specifyOn: ['Other'] },
    { id: 'purchaseDate', label: 'Purchase Date', type: 'date' },
    { id: 'purchasePrice', label: 'Purchase Price', type: 'currency' },
    {
      id: 'totalSumInsured',
      label: 'Total Sum Insured',
      type: 'readonly',
      inputInfoText: TIP_LIABILITY
    },
    { id: 'storageMethod', label: 'Storage Method', type: 'select', options: STORAGE_METHODS, specifyOn: ['Other'] },
    { id: 'locationAddress', label: 'Location Address', type: 'address' },
    {
      id: 'liabilityLimit',
      label: 'Liability Limit',
      type: 'select',
      options: LIABILITY_LIMITS
    },
    {
      id: 'waterSkiing',
      label: 'Do you require cover for water skiing and/or aquaplaning liability?',
      type: 'select',
      options: ['No', 'Yes'],
      infoText: TIP_WATER_SKIING
    },
    {
      id: 'yachtRacing',
      label: 'Do you require cover for official and/or organised yacht racing?',
      type: 'select',
      options: RACING_OPTIONS,
      showIf: isSailing,
      infoText: TIP_RACING
    }
  ];

  const fieldVisible = (f, d) => (f.showIf ? f.showIf(d) : true);
  const needsSpecify = (f, d) => !!f.specifyOn && f.specifyOn.includes(d[f.id]);

  function vesselInputHtml(f, d) {
    const val = d[f.id] ?? '';

    const selectHtml = options => `
      <select data-field="${f.id}">
        <option value="" disabled ${val === '' ? 'selected' : ''}>Select</option>
        ${options.map(o => {
          const value = typeof o === 'object' ? o.value : o;
          const label = typeof o === 'object' ? o.label : o;
          return `<option value="${esc(value)}" ${value === val ? 'selected' : ''}>${esc(label)}</option>`;
        }).join('')}
      </select>`;

    switch (f.type) {
      case 'select':
        return selectHtml(f.options);

      case 'length':
        return `
          <div class="length-input-group">
            <input type="number" data-field="hullLength" min="0" step="0.01" inputmode="decimal"
                   placeholder="0" value="${esc(d.hullLength || '')}">
            <select data-field="hullLengthUnit" class="length-unit">
              <option value="m" ${d.hullLengthUnit !== 'ft' ? 'selected' : ''}>m</option>
              <option value="ft" ${d.hullLengthUnit === 'ft' ? 'selected' : ''}>ft</option>
            </select>
          </div>`;

      case 'year':
        return `<input type="number" data-field="${f.id}" min="1900" max="9999" step="1" placeholder="YYYY" value="${esc(val)}">`;

      case 'date':
        return `<input type="date" data-field="${f.id}" max="${toInputDate(startOfToday())}" value="${esc(val)}">`;

      case 'currency':
        return `<input type="text" data-field="${f.id}" data-currency="true" inputmode="numeric" placeholder="$0" value="${esc(val)}">`;

      case 'readonly':
        return `<input type="text" class="readonly-input" value="${esc(val)}" readonly tabindex="-1">`;

      case 'address':
        return addressHtml('locationAddress', d);

      default:
        return `<input type="text" data-field="${f.id}" value="${esc(val)}">`;
    }
  }

  function vesselRowHtml(f, d) {
    const specify = f.specifyOn
      ? `<div class="conditional-field" data-specify-for="${f.id}" style="display:${needsSpecify(f, d) ? 'block' : 'none'};">
           <input type="text" data-field="${f.id}Specify" placeholder="Please Specify" value="${esc(d[`${f.id}Specify`] || '')}">
         </div>`
      : '';

    return `
      <div class="field-row ${f.type === 'address' ? 'align-top' : ''}" data-field-row="${f.id}"
           style="${fieldVisible(f, d) ? '' : 'display:none;'}">
        <p class="field-label">
          <span>${esc(f.label)}</span>

          ${f.infoText ? `
            <span class="info-tooltip">
              <span
                class="info-tooltip-icon"
                tabindex="0"
                aria-label="More information"
              >
                i
              </span>

              <span class="info-tooltip-box">
                ${f.infoText.replace(/\n/g, '<br>')}
              </span>
            </span>
          ` : ''}
        </p>
        <div class="field-input-wrap">
          <div class="${f.inputInfoText ? 'input-with-info' : ''}">

            ${f.inputInfoText ? `
              <span class="info-tooltip">
                <span class="info-tooltip-icon" tabindex="0">i</span>

                <span class="info-tooltip-box">
                  ${f.inputInfoText.replace(/\n/g, '<br>')}
                </span>
              </span>
            ` : ''}

            ${vesselInputHtml(f, d)}

          </div>

          ${specify}
        </div>
      </div>`;
  }


  function renderVesselStep() {
    quoteState.activeVessel = 0;

    const d =
      quoteState.vessels[0].details;

    $('vesselStepTitle').textContent =
      'Vessel Details';

    $('vesselFieldList').innerHTML =
      vesselFields
        .map(f => vesselRowHtml(f, d))
        .join('');

    checkStep3Complete();
  }


  // Show / hide conditional rows and clear values that are no longer relevant
  function syncVesselVisibility() {
    const d = currentVessel().details;

    vesselFields.forEach(f => {
      const row = document.querySelector(`[data-field-row="${f.id}"]`);
      if (f.showIf && row) {
        const visible = f.showIf(d);
        row.style.display = visible ? '' : 'none';
        if (!visible) {
          d[f.id] = '';
          d[`${f.id}Specify`] = '';
          const el = row.querySelector('select');
          if (el) el.value = '';
        }
      }

      if (f.specifyOn) {
        const wrap = document.querySelector(`[data-specify-for="${f.id}"]`);
        if (wrap) {
          const show = needsSpecify(f, d) && fieldVisible(f, d);
          wrap.style.display = show ? 'block' : 'none';
          if (!show) {
            d[`${f.id}Specify`] = '';
            const input = wrap.querySelector('input');
            if (input) input.value = '';
          }
        }
      }
    });
  }

  function onVesselInput(e) {
    const el = e.target;
    const key = el.dataset.field;
    if (!key) return;

    if (el.dataset.currency === 'true') formatCurrencyInput(el);

    currentVessel().details[key] = el.value;
    syncVesselVisibility();
    checkStep3Complete();
  }

  $('vesselFieldList').addEventListener('input', onVesselInput);
  $('vesselFieldList').addEventListener('change', onVesselInput);

  bindAddress($('vesselFieldList'), () => currentVessel().details, () => checkStep3Complete());

  function isVesselComplete(v) {
    const d = v.details;

    const baseFilled = vesselFields.every(f => {
      if (!fieldVisible(f, d)) return true;
      if (f.type === 'readonly') return true;
      if (f.type === 'address') return !!(d.locationAddress && d.locationAddress.trim());
      return d[f.id] !== undefined && d[f.id] !== '';
    });

    const specifyFilled = vesselFields.every(f => {
      if (!fieldVisible(f, d) || !needsSpecify(f, d)) return true;
      return !!(d[`${f.id}Specify`] && d[`${f.id}Specify`].trim());
    });

    return baseFilled && specifyFilled;
  }

  function checkStep3Complete() {
    if (DEV_BYPASS_VALIDATION) {
      $('continueStep3Btn').disabled = false;
      return;
    }
    $('continueStep3Btn').disabled = !isVesselComplete(currentVessel());
  }


  // ---------- STEP 4 (progress step 3): EXPERIENCE & HISTORY ----------
  const experienceFields = [
    { id: 'numOwners', label: 'How many people own this vessel?', options: OWNER_SKIPPER_OPTIONS },
    { id: 'numSkippers', label: 'How many people skipper this vessel?', options: OWNER_SKIPPER_OPTIONS }
  ];

  const past5YearsQuestions = [
    { id: 'cancelledRefused', text: 'Had any insurances cancelled, refused or had special conditions imposed?', details: true },
    { id: 'madeClaims', text: 'Made any boat insurance claims?' }
  ];

  const everQuestions = [
    { id: 'chargedConvicted', text: 'Been charged or convicted with any offence?', details: true },
    { id: 'lostLicence', text: 'Lost your boat or motor vehicle licence?', details: true }
  ];

  const skipperCount = e => (e.numSkippers ? optionNumber(e.numSkippers) : 1);

  function renderExperienceStep() {
    quoteState.activeVessel = 0;

    const e =
      quoteState.vessels[0].experience;

    $('experienceStepTitle').textContent =
      'Experience & History';

    $('experienceStepSub').textContent =
      'Please provide information about your experience and history.';

    $('experienceFieldList').innerHTML = experienceFields.map(f => `
      <div class="field-row" data-field-row="${f.id}">
        <p class="field-label">${esc(f.label)} <span class="required">*</span></p>
        <div class="field-input-wrap">
          <select data-exp-field="${f.id}">
            <option value="" disabled ${e[f.id] === '' ? 'selected' : ''}>Select</option>
            ${f.options.map(o => `<option value="${o}" ${e[f.id] === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
        </div>
      </div>`).join('');

    renderSkipperCards();
    renderYesNoList('past5YearsList', past5YearsQuestions, 'past5Years');
    renderYesNoList('everList', everQuestions, 'ever');
    syncClaimsWrap();
    renderClaimRows();
    checkStep4Complete();
  }

  $('experienceFieldList').addEventListener('change', ev => {
    const el = ev.target;
    if (!el.dataset.expField) return;

    const e = currentVessel().experience;
    e[el.dataset.expField] = el.value;

    if (el.dataset.expField === 'numSkippers') {
      const count = skipperCount(e);
      while (e.skippers.length < count) e.skippers.push(blankSkipper());
      e.skippers.length = count;
      renderSkipperCards();
    }

    checkStep4Complete();
  });


  // ----- Skippers (duplicated per skipper, as per the workbook) -----
  function skipperCardHtml(s, i) {
    const yearsSelect = (field, value) => `
      <select data-skipper-field="${field}">
        <option value="" disabled ${value === '' ? 'selected' : ''}>Select</option>
        ${YEARS_OPTIONS.map(o => `<option value="${o}" ${value === o ? 'selected' : ''}>${o}</option>`).join('')}
      </select>`;

    return `
      <div class="skipper-card" data-skipper-index="${i}">
        <div class="skipper-card-head">Skipper ${i + 1}</div>
        <div class="skipper-grid">

          <div class="additional-field">
            <label>Skipper name <span class="required">*</span></label>
            <input type="text" placeholder="Full Name" data-skipper-field="name" value="${esc(s.name)}">
          </div>

          <div class="additional-field">
            <label>Date of birth <span class="required">*</span></label>
            <input type="date" data-skipper-field="dob" max="${toInputDate(startOfToday())}" value="${esc(s.dob)}">
          </div>

          <div class="additional-field">
            <label>Date boat licence obtained <span class="required">*</span></label>
            <input type="date" data-skipper-field="licenceDate" max="${toInputDate(startOfToday())}" value="${esc(s.licenceDate)}">
          </div>

          <div class="additional-field">
            <label>Number of years owning a boat <span class="required">*</span></label>
            ${yearsSelect('yearsOwning', s.yearsOwning)}
          </div>

          <div class="additional-field">
            <label>Number of years owning a boat of this size and type <span class="required">*</span></label>
            ${yearsSelect('yearsSizeType', s.yearsSizeType)}
          </div>

          <div class="additional-field additional-field-full">
            <label>Details of previous boats owned <span class="optional-label">(length, type, period of ownership YYYY-YYYY)</span></label>
            <input type="text" data-skipper-field="previousBoats" placeholder="e.g. 6.2m runabout, 2015-2021" value="${esc(s.previousBoats)}">
          </div>

        </div>
      </div>`;
  }

  function renderSkipperCards() {
    const e = currentVessel().experience;
    $('skipperCards').innerHTML = e.skippers.map(skipperCardHtml).join('');
  }

  function onSkipperInput(ev) {
    const el = ev.target;
    const field = el.dataset.skipperField;
    if (!field) return;
    const card = el.closest('.skipper-card');
    const i = Number(card.dataset.skipperIndex);
    currentVessel().experience.skippers[i][field] = el.value;
    checkStep4Complete();
  }

  $('skipperCards').addEventListener('input', onSkipperInput);
  $('skipperCards').addEventListener('change', onSkipperInput);


  // ----- Yes / No questions -----
  function renderYesNoList(containerId, items, group) {
    const list = $(containerId);
    const e = currentVessel().experience;
    list.dataset.group = group;

    list.innerHTML = items.map(q => {
      const answer = e[group][q.id];
      const detail = q.details
        ? `<div class="detail-row" data-detail-for="${q.id}" style="display:${answer === 'yes' ? 'block' : 'none'};">
             <input type="text" data-detail="${q.id}" placeholder="Please Specify" value="${esc(e.details[q.id] || '')}">
           </div>`
        : '';

      return `
        <div class="question-row" data-qid="${q.id}">
          <p class="question-text">${esc(q.text)}</p>
          <div class="question-toggle">
            <button type="button" class="toggle-btn ${answer === 'yes' ? 'selected' : ''}" data-value="yes">Yes</button>
            <button type="button" class="toggle-btn ${answer === 'no' ? 'selected' : ''}" data-value="no">No</button>
          </div>
        </div>
        ${detail}`;
    }).join('');
  }

  function onYesNoClick(ev) {
    const btn = ev.target.closest('.toggle-btn');
    if (!btn) return;

    const list = ev.currentTarget;
    const group = list.dataset.group;
    const row = btn.closest('.question-row');
    const qid = row.dataset.qid;
    const e = currentVessel().experience;

    row.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    e[group][qid] = btn.dataset.value;

    const detail = list.querySelector(`[data-detail-for="${qid}"]`);
    if (detail) {
      detail.style.display = btn.dataset.value === 'yes' ? 'block' : 'none';
      if (btn.dataset.value !== 'yes') {
        e.details[qid] = '';
        detail.querySelector('input').value = '';
      }
    }

    if (group === 'past5Years' && qid === 'madeClaims') {
      if (btn.dataset.value === 'yes' && e.claims.length === 0) e.claims.push({ dateOfLoss: '', description: '', settlement: '' });
      if (btn.dataset.value !== 'yes') e.claims = [];
      syncClaimsWrap();
      renderClaimRows();
    }

    checkStep4Complete();
  }

  function onDetailInput(ev) {
    const el = ev.target;
    if (!el.dataset.detail) return;
    currentVessel().experience.details[el.dataset.detail] = el.value;
    checkStep4Complete();
  }

  ['past5YearsList', 'everList'].forEach(id => {
    $(id).addEventListener('click', onYesNoClick);
    $(id).addEventListener('input', onDetailInput);
  });


  // ----- Claims (duplicate lines for multiple claims) -----
  function syncClaimsWrap() {
    const e = currentVessel().experience;
    $('claimsWrap').style.display = e.past5Years.madeClaims === 'yes' ? 'block' : 'none';
  }

  function renderClaimRows() {
    const e = currentVessel().experience;
    $('claimsRows').innerHTML = e.claims.map((c, i) => `
      <div class="claims-row" data-claim-index="${i}">
        <input type="date" data-claim-field="dateOfLoss" max="${toInputDate(startOfToday())}" value="${esc(c.dateOfLoss)}">
        <input type="text" placeholder="Description of Loss" data-claim-field="description" value="${esc(c.description)}">
        <input type="number" min="0" placeholder="$" data-claim-field="settlement" value="${esc(c.settlement)}">
        ${i > 0 ? `<button type="button" class="remove-row-btn" data-remove-claim="${i}" aria-label="Remove claim">×</button>` : '<span></span>'}
      </div>`).join('');
  }

  $('claimsRows').addEventListener('input', ev => {
    const el = ev.target;
    if (!el.dataset.claimField) return;
    const i = Number(el.closest('.claims-row').dataset.claimIndex);
    currentVessel().experience.claims[i][el.dataset.claimField] = el.value;
    checkStep4Complete();
  });

  $('claimsRows').addEventListener('click', ev => {
    const btn = ev.target.closest('[data-remove-claim]');
    if (!btn) return;
    currentVessel().experience.claims.splice(Number(btn.dataset.removeClaim), 1);
    renderClaimRows();
    checkStep4Complete();
  });

  $('addClaimBtn').addEventListener('click', () => {
    currentVessel().experience.claims.push({ dateOfLoss: '', description: '', settlement: '' });
    renderClaimRows();
    checkStep4Complete();
  });


  // ----- Validation -----
  function isExperienceComplete(v) {
    const e = v.experience;

    const topFieldsFilled = experienceFields.every(f => e[f.id] !== '' && e[f.id] !== undefined);

    const skippersFilled = e.skippers.length > 0 && e.skippers.every(s =>
      s.name && s.dob && s.licenceDate && s.yearsOwning && s.yearsSizeType
    );

    const past5Answered = past5YearsQuestions.every(q => e.past5Years[q.id] !== undefined);
    const everAnswered = everQuestions.every(q => e.ever[q.id] !== undefined);

    const detailsFilled = [...past5YearsQuestions.map(q => ({ q, group: 'past5Years' })), ...everQuestions.map(q => ({ q, group: 'ever' }))]
      .filter(x => x.q.details && e[x.group][x.q.id] === 'yes')
      .every(x => (e.details[x.q.id] || '').trim() !== '');

    let claimsValid = true;
    if (e.past5Years.madeClaims === 'yes') {
      claimsValid = e.claims.length > 0 && e.claims.every(c => c.dateOfLoss && c.description && c.settlement !== '');
    }

    return topFieldsFilled && skippersFilled && past5Answered && everAnswered && detailsFilled && claimsValid;
  }

  function checkStep4Complete() {
    if (DEV_BYPASS_VALIDATION) {
      $('continueBtn4').disabled = false;
      return;
    }
    $('continueBtn4').disabled = !isExperienceComplete(currentVessel());
  }
// ==================================================
// ADDITIONAL BOATS
// ==================================================

let hasAdditionalBoats = '';
let additionalBoatCount = 0;


function createAdditionalBoat() {
  const primary =
    quoteState.vessels[0];

  return {
    details: {
      totalSumInsured:
        'Third Party Legal Liability Only',
      hullLengthUnit: 'm'
    },

    experience: clone(
      primary.experience
    ),

    additional: {},

    hasDifferentSkipper: ''
  };
}


function renderAdditionalBoatInput(field, boat) {
  return vesselInputHtml(
    field,
    boat.details
  );
}


function addAdditionalBoat() {
  const boat =
    createAdditionalBoat();

  quoteState.vessels.push(boat);

  additionalBoatCount++;

  renderAdditionalBoats();
}


function removeAdditionalBoat(index) {
  quoteState.vessels.splice(
    index,
    1
  );

  renderAdditionalBoats();
}


function renderAdditionalBoats() {
  const host =
    $('additionalBoatsList');

  const additionalBoats =
    quoteState.vessels.slice(1);

  host.innerHTML =
    additionalBoats.map((boat, arrayIndex) => {

      const vesselIndex =
        arrayIndex + 1;

      return `
        <div
          class="additional-boat-card"
          data-additional-vessel="${vesselIndex}"
        >

          <div class="additional-boat-header">

            <h4>
              Additional Boat ${arrayIndex + 1}
            </h4>

            <button
              type="button"
              class="remove-row-btn"
              data-remove-additional-boat="${vesselIndex}"
              aria-label="Remove additional boat"
            >
              ×
            </button>

          </div>


          <div class="field-list">

            ${vesselFields.map(field => {

              if (
                field.showIf &&
                !field.showIf(boat.details)
              ) {
                return '';
              }

              return `
                <div
                  class="field-row ${
                    field.type === 'address'
                      ? 'align-top'
                      : ''
                  }"
                  data-additional-field-row="${field.id}"
                >

                  <p class="field-label">
                    ${esc(field.label)}
                  </p>

                  <div class="field-input-wrap">

                    ${renderAdditionalBoatInput(
                      field,
                      boat
                    )}

                    ${
                      field.specifyOn
                        ? `
                          <div
                            class="conditional-field"
                            data-additional-specify="${field.id}"
                            style="display:${
                              needsSpecify(
                                field,
                                boat.details
                              )
                                ? 'block'
                                : 'none'
                            };"
                          >
                            <input
                              type="text"
                              data-field="${field.id}Specify"
                              placeholder="Please Specify"
                              value="${esc(
                                boat.details[
                                  `${field.id}Specify`
                                ] || ''
                              )}"
                            >
                          </div>
                        `
                        : ''
                    }

                  </div>

                </div>
              `;
            }).join('')}

          </div>


          <div class="additional-skipper-question">

            <span>
              Will this boat have a different skipper?
              <span class="required">*</span>
            </span>

            <div class="question-toggle">

              <button
                type="button"
                class="toggle-btn ${
                  boat.hasDifferentSkipper === 'yes'
                    ? 'selected'
                    : ''
                }"
                data-different-skipper="yes"
              >
                Yes
              </button>

              <button
                type="button"
                class="toggle-btn ${
                  boat.hasDifferentSkipper === 'no'
                    ? 'selected'
                    : ''
                }"
                data-different-skipper="no"
              >
                No
              </button>

            </div>

          </div>


          <div
            class="additional-skipper-section"
            style="display:${
              boat.hasDifferentSkipper === 'yes'
                ? 'block'
                : 'none'
            };"
          >

            <p class="subsection-label">
              Skipper Details
            </p>

            <div
              class="additional-skipper-cards"
              data-additional-skipper-cards
            >
              ${
                boat.hasDifferentSkipper === 'yes'
                  ? boat.experience.skippers
                      .map(skipperCardHtml)
                      .join('')
                  : ''
              }
            </div>

            <button
              type="button"
              class="add-row-btn"
              data-add-additional-skipper
              aria-label="Add another skipper"
            >
              +
            </button>

          </div>

        </div>
      `;
    }).join('');

  checkAdditionalBoatsComplete();
}

function checkAdditionalBoatsComplete() {
  const continueButton =
    $('continueAdditionalBoatsBtn');

  if (hasAdditionalBoats === 'no') {
    continueButton.disabled = false;
    return;
  }

  if (hasAdditionalBoats !== 'yes') {
    continueButton.disabled = true;
    return;
  }

  if (DEV_BYPASS_VALIDATION) {
    continueButton.disabled = false;
    return;
  }

  const additionalBoats =
    quoteState.vessels.slice(1);

  const complete =
    additionalBoats.length > 0 &&
    additionalBoats.every(boat => {
      const vesselComplete =
        isVesselComplete(boat);

      const skipperChoiceComplete =
        boat.hasDifferentSkipper === 'yes' ||
        boat.hasDifferentSkipper === 'no';

      const skipperComplete =
        boat.hasDifferentSkipper !== 'yes' ||
        (
          boat.experience.skippers.length > 0 &&
          boat.experience.skippers.every(skipper =>
            skipper.name &&
            skipper.dob &&
            skipper.licenceDate &&
            skipper.yearsOwning &&
            skipper.yearsSizeType
          )
        );

      return (
        vesselComplete &&
        skipperChoiceComplete &&
        skipperComplete
      );
    });

  continueButton.disabled = !complete;
}


// YES / NO ADDITIONAL BOATS

document
  .querySelectorAll(
    '#hasAdditionalBoatToggle .toggle-btn'
  )
  .forEach(button => {

    button.addEventListener('click', () => {

      document
        .querySelectorAll(
          '#hasAdditionalBoatToggle .toggle-btn'
        )
        .forEach(toggle => {
          toggle.classList.remove('selected');
        });

      button.classList.add('selected');

      hasAdditionalBoats =
        button.dataset.value;

      const addButton =
        $('addBoatRowBtn');

      if (hasAdditionalBoats === 'yes') {

        addButton.style.display =
          'inline-flex';

        if (quoteState.vessels.length === 1) {
          addAdditionalBoat();
        }

      } else {

        addButton.style.display =
          'none';

        quoteState.vessels =
          quoteState.vessels.slice(0, 1);

        renderAdditionalBoats();
      }

      checkAdditionalBoatsComplete();
    });
  });


$('addBoatRowBtn').addEventListener(
  'click',
  addAdditionalBoat
);


// ADDITIONAL BOAT FIELD EVENTS

$('additionalBoatsList')
  .addEventListener('input', event => {
    updateAdditionalBoatField(event);
  });

$('additionalBoatsList')
  .addEventListener('change', event => {
    updateAdditionalBoatField(event);
  });


function updateAdditionalBoatField(event) {
  const element =
    event.target;

  const card =
    element.closest(
      '[data-additional-vessel]'
    );

  if (!card) return;

  const vesselIndex =
    Number(
      card.dataset.additionalVessel
    );

  const boat =
    quoteState.vessels[vesselIndex];

  if (!boat) return;


  // VESSEL FIELD
  if (
    element.dataset.field &&
    !element.dataset.skipperField
  ) {
    const fieldName =
      element.dataset.field;

    if (
      element.dataset.currency === 'true'
    ) {
      formatCurrencyInput(element);
    }

    boat.details[fieldName] =
      element.value;

    const definition =
      vesselFields.find(
        field => field.id === fieldName
      );

    if (
      definition &&
      definition.specifyOn
    ) {
      const specifyWrap =
        card.querySelector(
          `[data-additional-specify="${fieldName}"]`
        );

      if (specifyWrap) {
        const show =
          definition.specifyOn.includes(
            element.value
          );

        specifyWrap.style.display =
          show ? 'block' : 'none';

        if (!show) {
          boat.details[
            `${fieldName}Specify`
          ] = '';

          const input =
            specifyWrap.querySelector(
              'input'
            );

          if (input) {
            input.value = '';
          }
        }
      }
    }

    renderAdditionalBoatConditionalFields(
      card,
      boat
    );
  }


  // SKIPPER FIELD
  if (element.dataset.skipperField) {
    const skipperCard =
      element.closest(
        '[data-skipper-index]'
      );

    if (!skipperCard) return;

    const skipperIndex =
      Number(
        skipperCard.dataset.skipperIndex
      );

    boat.experience.skippers[
      skipperIndex
    ][element.dataset.skipperField] =
      element.value;
  }

  checkAdditionalBoatsComplete();
}


function renderAdditionalBoatConditionalFields(
  card,
  boat
) {
  vesselFields.forEach(field => {

    if (!field.showIf) return;

    const row =
      card.querySelector(
        `[data-additional-field-row="${field.id}"]`
      );

    if (!row) return;

    const visible =
      field.showIf(boat.details);

    row.style.display =
      visible ? '' : 'none';

    if (!visible) {
      boat.details[field.id] = '';
      boat.details[
        `${field.id}Specify`
      ] = '';
    }
  });
}


// CLICK EVENTS INSIDE BOAT CARDS

$('additionalBoatsList')
  .addEventListener('click', event => {

    const card =
      event.target.closest(
        '[data-additional-vessel]'
      );

    if (!card) return;

    const vesselIndex =
      Number(
        card.dataset.additionalVessel
      );

    const boat =
      quoteState.vessels[vesselIndex];

    if (!boat) return;


    // REMOVE BOAT
    const removeBoat =
      event.target.closest(
        '[data-remove-additional-boat]'
      );

    if (removeBoat) {
      removeAdditionalBoat(
        vesselIndex
      );

      return;
    }


    // DIFFERENT SKIPPER
    const skipperChoice =
      event.target.closest(
        '[data-different-skipper]'
      );

    if (skipperChoice) {

      boat.hasDifferentSkipper =
        skipperChoice.dataset
          .differentSkipper;

      if (
        boat.hasDifferentSkipper === 'yes'
      ) {

        boat.experience.skippers = [
          blankSkipper()
        ];

      } else {

        boat.experience =
          clone(
            quoteState.vessels[0]
              .experience
          );
      }

      renderAdditionalBoats();
      return;
    }


    // ADD SKIPPER
    const addSkipper =
      event.target.closest(
        '[data-add-additional-skipper]'
      );

    if (addSkipper) {

      boat.experience.skippers.push(
        blankSkipper()
      );

      renderAdditionalBoats();
    }
  });

  // ---------- RATING ENGINE (TPO RATING + TPO CALCULATIONS sheets) ----------
  // Runs per vessel, then combined for the quote screen.

  function hullLengthInMetres(d) {
    const n = Number(d.hullLength);
    if (!n || isNaN(n)) return null;
    return d.hullLengthUnit === 'ft' ? round2(n * 0.3048) : round2(n);
  }

  function motorTypeGroup(motorType) {
    // AllKnownMotors named range on TPO DROPDOWNS
    if (ci(CAT1_MOTORS, motorType)) return 'cat1';
    if (ci(REFER_MOTORS, motorType)) return 'refer';
    // Sterndrive Diesel / Inboard Diesel / Jet Drive Diesel sit in AllKnownMotors but not Cat1/Refer lists
    return 'diesel';
  }

  function skipperAgeYears(dobStr) {
    if (!dobStr) return null;
    const dob = parseDate(dobStr);
    const today = startOfToday();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  }

  // TPO CALCULATIONS: Cat1..Cat5 Category Eligible checks, evaluated in order
  function vesselCategory(v) {
    const d = v.details;
    const lengthM = hullLengthInMetres(d);
    const storage = d.storageMethod;
    const motorGroup = motorTypeGroup(d.motorType);
    const skipperYears = v.experience.skippers.map(s => (s.yearsOwning === '5+' ? 5 : Number(s.yearsOwning || 0)));
    const minExperience = skipperYears.length ? Math.min(...skipperYears) : 0;

    if (lengthM == null || !storage || !d.motorType) return null;

    const cat1Eligible = lengthM <= 7 && ci(CAT1_STORAGE, storage) && ci(CAT1_MOTORS, d.motorType);
    if (cat1Eligible) return 1;

    const cat2Eligible = lengthM <= 9 && motorGroup !== 'refer';
    if (cat2Eligible) {
      // Sheet as written: Category 2 experience "0 = OK, 1+ = Refer" (kept literal; see CAT2_EXPERIENCE_AS_WRITTEN)
      return 2;
    }

    const cat3Eligible = lengthM <= 12 && motorGroup !== 'refer';
    if (cat3Eligible) return 3;

    const cat4Eligible = lengthM > 12 && lengthM <= 15 && motorGroup !== 'refer';
    if (cat4Eligible) return 4;

    if (lengthM > 15) return 5;

    return 5; // fallback: anything not matched above (e.g. Refer-only motor at Cat3/4 length) still rates as Cat5
  }

  // Referral reasons contributed by rating-adjacent answers (workbook "Notes" column, Referral Lvl 3/5)
  function vesselReferralReasons(v) {
    const d = v.details;
    const reasons = [];
    const lengthM = hullLengthInMetres(d);

    if (d.hullMake === 'Other') reasons.push('Hull Make: Other (please specify)');
    if (HULL_MAKES_REFER.includes(d.hullMake)) reasons.push(`Hull Make: ${d.hullMake}`);
    if (d.hullYearBuilt && (new Date().getFullYear() - Number(d.hullYearBuilt)) > 40) reasons.push('Hull age over 40 years');
    if (HULL_CONSTRUCTION_REFER.includes(d.hullConstruction)) reasons.push(`Hull Construction: ${d.hullConstruction}`);

    if (lengthM != null) {
      if (lengthM < 7 && STORAGE_REFER_UNDER_7M.includes(d.storageMethod)) {
        reasons.push(`Hull under 7.00m with storage method: ${d.storageMethod}`);
      }
      if (lengthM > 15) reasons.push('Hull over 15.00m / 50.00ft');
    }

    if (HULL_TYPES_REFER.includes(d.hullType)) reasons.push(`Hull Type: ${d.hullType}`);
    if (d.hullType === 'Other') reasons.push('Hull Type: Other (please specify)');
    if (isSailing(d) && d.mastConstruction === 'Other') reasons.push('Mast Construction: Other (please specify)');

    if (NUMBER_OF_MOTORS_REFER.includes(d.numMotors)) reasons.push(`Number of Motors: ${d.numMotors}`);
    if (MOTOR_MAKES_REFER.includes(d.motorMake)) reasons.push(`Motor Make: ${d.motorMake}`);
    if (d.motorMake === 'Other') reasons.push('Motor Make: Other (please specify)');
    if (d.motorType === 'Other') reasons.push('Motor Type: Other (please specify)');
    if (REFER_MOTORS.includes(d.motorType)) reasons.push(`Motor Type: ${d.motorType}`);

    if (STORAGE_REFER.includes(d.storageMethod)) reasons.push(`Storage Method: ${d.storageMethod}`);
    if (d.storageMethod === 'Other') reasons.push('Storage Method: Other (please specify)');

    if (d.locationAddressPostcode && REFERRAL_POSTCODES.has(d.locationAddressPostcode)) {
      reasons.push(`Location postcode ${d.locationAddressPostcode} is on the referred postcode list`);
    }

    if (isSailing(d) && d.yachtRacing === RACING_REFER) reasons.push('Yacht Racing: Racing over 50 Nautical Miles');

    // Experience & History
    const exp = v.experience;
    if (OWNER_SKIPPER_REFER.includes(exp.numOwners)) reasons.push(`Number of owners: ${exp.numOwners}`);
    if (OWNER_SKIPPER_REFER.includes(exp.numSkippers)) reasons.push(`Number of skippers: ${exp.numSkippers}`);

    exp.skippers.forEach((s, i) => {
      const label = exp.skippers.length > 1 ? ` (Skipper ${i + 1})` : '';
      const age = skipperAgeYears(s.dob);
      if (age != null && age < 25) reasons.push(`Skipper age under 25${label}`);
      if (s.licenceDate) {
        const months = (startOfToday() - parseDate(s.licenceDate)) / (1000 * 60 * 60 * 24 * 30.44);
        if (months < 12) reasons.push(`Boat licence obtained less than 12 months ago${label}`);
      }
      if (s.yearsOwning === '0') reasons.push(`Years owning a boat: 0${label}`);
      if (s.yearsSizeType === '0') reasons.push(`Years owning a boat of this size and type: 0${label}`);
    });

    if (exp.past5Years.cancelledRefused === 'yes') reasons.push('Insurance cancelled, refused or special conditions imposed in past 5 years');
    if (exp.past5Years.madeClaims === 'yes') reasons.push(`Boat insurance claim(s) made in past 5 years (${exp.claims.length})`);
    if (exp.ever.chargedConvicted === 'yes') reasons.push('Charged or convicted of an offence');
    if (exp.ever.lostLicence === 'yes') reasons.push('Lost boat or motor vehicle licence');

    // Category-2-as-written experience rule, and the flat referral triggers below
    const cat = vesselCategory(v);
    if (cat === 2 && CAT2_EXPERIENCE_AS_WRITTEN) {
      const minYears = exp.skippers.length
        ? Math.min(...exp.skippers.map(s => (s.yearsOwning === '5+' ? 5 : Number(s.yearsOwning || 0))))
        : 0;
      if (minYears >= 1) reasons.push('Category 2 vessel: skipper experience of 1+ years');
    }
    if (cat === 3 && exp.skippers.some(s => Number(s.yearsOwning || 0) === 0 && s.yearsOwning !== '5+')) {
      reasons.push('Category 3 vessel: skipper with 0 years experience');
    }
    if (cat === 4 && exp.skippers.some(s => ['0', '1', '2'].includes(s.yearsOwning))) {
      reasons.push('Category 4 vessel: skipper with 0-2 years experience');
    }
    if (cat === 5) reasons.push('Category 5 vessel (over 15.01m and/or Refer-only motor)');

    if (quoteState.yourQuote.wreck === '1000000') reasons.push('Recovery or removal of wreck cover requested');
    if (d.liabilityLimit === '20000000') { /* rateable loading, not a referral trigger on its own */ }

    return [...new Set(reasons)];
  }

  // TPO CALCULATIONS: sequential premium build for one vessel
  function ratePremium(v) {
    const cat = vesselCategory(v);
    if (!cat) return null;

    const base = RATING_CATEGORIES[cat];
    let running = base.premium;

    const exp = v.experience;
    const d = v.details;

    // Removal of wreck (+30%)
    if (quoteState.yourQuote.wreck === '1000000') running += running * LOADINGS.wreck;

    // Racing risk (+30%)
    const racing = isSailing(d) && d.yachtRacing && d.yachtRacing !== 'No';
    if (racing) running += running * LOADINGS.racing;

    // Claims loading (+25% per claim)
    const claimCount = exp.past5Years.madeClaims === 'yes' ? exp.claims.length : 0;
    if (claimCount > 0) running += running * (LOADINGS.claimEach * claimCount);

    // Skippers under 25 (+20% per skipper, compounding on running total as per sheet)
    const under25Count = exp.skippers.filter(s => {
      const age = skipperAgeYears(s.dob);
      return age != null && age < 25;
    }).length;
    if (under25Count > 0) running += running * (LOADINGS.under25Each * under25Count);

    // Cancelled / convicted / lost licence (+25%, flat once if any apply)
    const anyConductFlag = exp.past5Years.cancelledRefused === 'yes' || exp.ever.chargedConvicted === 'yes' || exp.ever.lostLicence === 'yes';
    if (anyConductFlag) running += running * LOADINGS.cancelledConvicted;

    // Water skiing (+$90 flat)
    if (d.waterSkiing === 'Yes') running += LOADINGS.waterSkiingFlat;

    // $20M liability limit (+20%)
    if (d.liabilityLimit === '20000000') running += running * LOADINGS.liability20M;

    const basePremium = round2(running);
    const gst = round2(basePremium * GST_RATE);
    const stampDuty = round2((basePremium + gst) * STAMP_DUTY_RATE);

    return {
      category: cat,
      basePremium, gst, stampDuty,
      excessAllOther: base.excess,
      excessRacing: racing ? base.excess * 2 : null,
      racing, claimCount, under25Count, anyConductFlag
    };
  }

  function rateAllVessels() {
    return quoteState.vessels.map(v => ({ vessel: v, rating: ratePremium(v) }));
  }

  function combineQuote() {
    const rated = rateAllVessels();
    const allCategorised = rated.every(r => r.rating);

    const basePremium = round2(rated.reduce((s, r) => s + (r.rating ? r.rating.basePremium : 0), 0));
    const gst = round2(rated.reduce((s, r) => s + (r.rating ? r.rating.gst : 0), 0));
    const stampDuty = round2(rated.reduce((s, r) => s + (r.rating ? r.rating.stampDuty : 0), 0));
    const adminFee = allCategorised ? ADMIN_FEE : 0;
    const feeGst = allCategorised ? ADMIN_FEE_GST : 0;
    const totalPremium = round2(basePremium + gst + stampDuty + adminFee + feeGst);
    const instalment = round2((totalPremium * INSTALMENT_FACTOR) / INSTALMENTS);
    const brokerCommission = round2(basePremium * BROKER_COMMISSION_RATE);

    return { rated, allCategorised, basePremium, gst, stampDuty, adminFee, feeGst, totalPremium, instalment, brokerCommission };
  }

  function allReferralReasons() {
    const declineReasons = getDeclineReasons();
    const vesselReasons = quoteState.vessels.flatMap((v, i) =>
      vesselReferralReasons(v).map(r => quoteState.vessels.length > 1 ? `Vessel ${i + 1}: ${r}` : r)
    );
    return { declineReasons, referReasons: vesselReasons };
  }


  // ---------- STEP 5 (progress step 4): YOUR QUOTE ----------

  function policyPeriodDefaults() {
    if (!quoteState.yourQuote.policyStartDate) {
      quoteState.yourQuote.policyStartDate = toInputDate(startOfToday());
    }
    if (!quoteState.yourQuote.policyEndDate) {
      const start = parseDate(quoteState.yourQuote.policyStartDate);
      quoteState.yourQuote.policyEndDate = toInputDate(addMonths(start, 12));
    }
  }

  function renderQuotePremium(combined) {
    const host = $('quotePremiumHost');

    if (!combined.allCategorised) {
      host.innerHTML = `
        <div class="quote-premium-panel quote-premium-pending">
          <p>We need a little more information before we can calculate your premium.</p>
          <p class="quote-premium-pending-sub">Complete the vessel and experience details for every boat to see pricing here.</p>
        </div>`;
      return;
    }

    const rows = [
      ['Total Base Premium', money(combined.basePremium)],
      ['GST', money(combined.gst)],
      ['Stamp Duty', money(combined.stampDuty)],
      ['Administration Fee', money(combined.adminFee)],
      ['Fee GST', money(combined.feeGst)]
    ];

    host.innerHTML = `
      <div class="quote-premium-panel">
        <div class="quote-premium-rows">
          ${rows.map(([l, v]) => `<div class="quote-premium-row"><span>${l}</span><span>${v}</span></div>`).join('')}
        </div>
        <div class="quote-premium-total">
          <span>Total Premium Payable</span>
          <span>${money(combined.totalPremium)}</span>
        </div>
        <div class="quote-premium-instalment">
          Or pay in ${INSTALMENTS} monthly instalments of <strong>${money(combined.instalment)}</strong>
        </div>
        <div class="quote-premium-broker">
          Broker Commission (${Math.round(BROKER_COMMISSION_RATE * 100)}%): ${money(combined.brokerCommission)}
        </div>
      </div>`;
  }

  function renderExcess(combined) {
    const rows = combined.rated.map((r, i) => {
      if (!r.rating) return '';
      const label = combined.rated.length > 1 ? `Vessel ${i + 1}` : 'All Other Claims';
      const racingRow = r.rating.racing
        ? `<div class="excess-row"><span>${combined.rated.length > 1 ? `Vessel ${i + 1} — Whilst Racing` : 'Whilst Racing'}</span><span>${money(r.rating.excessRacing)}</span></div>`
        : '';
      return `<div class="excess-row"><span>${label}</span><span>${money(r.rating.excessAllOther)}</span></div>${racingRow}`;
    }).join('');
    $('excessBody').innerHTML = rows || '<p class="quote-premium-pending-sub">Excess will show here once vessel details are complete.</p>';
  }

  function renderCoverList() {
    const anyRacing = quoteState.vessels.some(v => isSailing(v.details) && v.details.yachtRacing && v.details.yachtRacing !== 'No');
    const anySkiing = quoteState.vessels.some(v => v.details.waterSkiing === 'Yes');
    const liabilityLimits = [...new Set(quoteState.vessels.map(v => v.details.liabilityLimit).filter(Boolean))];
    const liabilityLabel = liabilityLimits.length
      ? liabilityLimits.map(l => LIABILITY_LIMITS.find(x => x.value === l)?.label || l).join(' / ')
      : '—';

    const rows = [
      ['Policy Type', 'Third Party Legal Liability Only'],
      ['Basis of Settlement', 'Legal Liability Only'],
      ['Third Party Legal Liability', `${liabilityLabel} — any one claim or all claims arising from one accident`, TIP_LIABILITY],
      ['Pollution', '$1,000,000 for any one Accident or series of Accidents caused by the one event'],
      ['Geographical Limits', '250 Nautical Miles off the Australian Mainland including Tasmania. Subject to the vessel being south of 23.5° South between 1 December – 1 April.' +
        (quoteState.vessels.some(v => v.details.locationAddressPostcode && REFERRAL_POSTCODES.has(v.details.locationAddressPostcode)) ? '' : '')],
      ['Water Skiing and/or Aquaplaning Liability', anySkiing ? 'Yes' : 'No', TIP_WATER_SKIING],
      ['Yacht Racing', anyRacing ? (quoteState.vessels.find(v => isSailing(v.details) && v.details.yachtRacing !== 'No')?.details.yachtRacing || 'Yes') : 'No', TIP_RACING],
      ['Recovery or Removal of Wreck', quoteState.yourQuote.wreck === '1000000' ? '$1,000,000' : 'Not Insured',
        'Availability subject to approval. Additional documentation may be required.']
    ];

    $('coverList').innerHTML = rows.map(([l, v, tip]) => `
      <div class="summary-row">
        <span class="summary-label">${esc(l)}${tip ? `<span class="info-dot" data-tip="${esc(tip)}">ⓘ</span>` : ''}</span>
        <span class="summary-value">${esc(v)}</span>
      </div>`).join('') + `
      <div class="summary-row wreck-toggle-row">
        <span class="summary-label">Include Recovery or Removal of Wreck ($1,000,000)?</span>
        <label class="mini-toggle">
          <input type="checkbox" id="wreckToggle" ${quoteState.yourQuote.wreck === '1000000' ? 'checked' : ''}>
          <span></span>
        </label>
      </div>`;

    $('coverList').querySelectorAll('.info-dot').forEach(dot => {
      dot.addEventListener('click', () => alert(dot.dataset.tip));
    });

    const toggle = $('wreckToggle');
    if (toggle) {
      toggle.addEventListener('change', () => {
        quoteState.yourQuote.wreck = toggle.checked ? '1000000' : 'not-insured';
        renderQuoteStep();
      });
    }
  }

  function renderVesselSummary() {
    $('vesselSummaryList').innerHTML = quoteState.vessels.map((v, i) => {
      const d = v.details;
      const lengthM = hullLengthInMetres(d);
      const bits = [d.hullYearBuilt, d.hullMake === 'Other' ? d.hullMakeSpecify : d.hullMake, d.hullModel].filter(Boolean).join(' ');
      return `
        <div class="summary-row">
          <span class="summary-label">Vessel ${i + 1}</span>
          <span class="summary-value">
            ${esc(bits || '—')}<br>
            <em>${esc(d.locationAddress || '—')} · ${lengthM != null ? lengthM + 'm' : '—'}</em>
          </span>
        </div>`;
    }).join('');
  }

  function renderSkipperSummary() {
    const allSkippers = quoteState.vessels.flatMap((v, vi) =>
      v.experience.skippers.map((s, si) => ({ ...s, vi, si, single: quoteState.vessels.length === 1 }))
    );
    $('skipperSummaryList').innerHTML = allSkippers.map(s => `
      <div class="summary-row">
        <span class="summary-label">${s.single ? `Skipper ${s.si + 1}` : `Vessel ${s.vi + 1} — Skipper ${s.si + 1}`}</span>
        <span class="summary-value">${esc(s.name || '—')}${s.dob ? ` · ${formatDate(s.dob)}` : ''}</span>
      </div>`).join('') || '<p class="quote-premium-pending-sub">No skipper details yet.</p>';
  }

  function renderQuoteStep() {
    policyPeriodDefaults();
    $('quoteNumberText').textContent = quoteState.yourQuote.quoteNumber;
    $('policyStartDate').value = quoteState.yourQuote.policyStartDate;
    $('policyEndDate').value = quoteState.yourQuote.policyEndDate;

    const combined = combineQuote();
    quoteState._combined = combined;

    const { declineReasons, referReasons } = allReferralReasons();
    const incomplete = !combined.allCategorised;

    $('quoteIncompleteNotice').style.display = incomplete ? 'block' : 'none';
    if (incomplete) {
      $('quoteIncompleteNotice').textContent = 'Some vessel or experience details are still missing — go back and complete every vessel to see full pricing.';
    }

    document.querySelectorAll('.quote-hide-on-referral').forEach(el => {
      el.style.display = (referReasons.length && !DEV_BYPASS_VALIDATION) ? 'none' : '';
    });
    // Even with DEV_BYPASS_VALIDATION true, still show what a referral would look like via the banner below,
    // but do not hide the informational panels (so the flow can be exercised end-to-end while testing).
    if (referReasons.length) {
      let banner = document.getElementById('referralBanner');
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'referralBanner';
        banner.className = 'referral-banner';
        $('quoteCard').insertBefore(banner, $('quoteIncompleteNotice').nextSibling);
      }
      banner.innerHTML = `<strong>This quote needs a quick review by our team</strong> before it can be finalised.
        <ul>${referReasons.slice(0, 6).map(r => `<li>${esc(r)}</li>`).join('')}${referReasons.length > 6 ? `<li>+ ${referReasons.length - 6} more</li>` : ''}</ul>`;
    } else {
      const banner = document.getElementById('referralBanner');
      if (banner) banner.remove();
    }

    renderQuotePremium(combined);
    renderExcess(combined);
    renderCoverList();
    renderVesselSummary();
    renderSkipperSummary();

    $('continueBtn5').textContent = referReasons.length ? 'Submit for Review →' : 'Buy Online';
  }

  $('policyStartDate').addEventListener('change', e => {
    quoteState.yourQuote.policyStartDate = e.target.value;
    const start = parseDate(e.target.value);
    const maxEnd = addMonths(start, 12);
    const currentEnd = parseDate(quoteState.yourQuote.policyEndDate);
    if (!currentEnd || currentEnd > maxEnd || currentEnd <= start) {
      quoteState.yourQuote.policyEndDate = toInputDate(maxEnd);
    }
    renderQuoteStep();
  });
  $('policyEndDate').addEventListener('change', e => {
    quoteState.yourQuote.policyEndDate = e.target.value;
  });




  // ---------- DECLINE / REFERRAL GATING ----------
  // NOTE: modal visibility is driven by the '.active' class (matches the
  // .quote-modal-overlay.active / .decline-modal-overlay.active rules in
  // TPCP.css, carried over from jet-ski.css) plus a body scroll-lock class.
  function openModal(el) {
    el.classList.add('active');
    el.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }
  function closeModal(el) {
    el.classList.remove('active');
    el.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  function declineModalOpen() { openModal($('declineModal')); }
  function declineModalClose() {
  window.location.href = 'products.html';
  }

  $('declineCloseBtn').addEventListener('click', declineModalClose);
  $('declineModalX').addEventListener('click', declineModalClose);
  $('declineModal').addEventListener('click', e => { if (e.target === $('declineModal')) declineModalClose(); });

  function emailModalOpen() { openModal($('emailQuoteModal')); }
  function emailModalClose() { closeModal($('emailQuoteModal')); }
  $('closeEmailQuoteModal').addEventListener('click', emailModalClose);
  $('emailQuoteModal').addEventListener('click', e => { if (e.target === $('emailQuoteModal')) emailModalClose(); });

  function referralModalOpen() { openModal($('referralQuoteModal')); }
  function referralModalClose() { closeModal($('referralQuoteModal')); }
  $('closeReferralQuoteModal').addEventListener('click', referralModalClose);
  $('referralQuoteModal').addEventListener('click', e => { if (e.target === $('referralQuoteModal')) referralModalClose(); });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    [$('declineModal'), $('emailQuoteModal'), $('referralQuoteModal')].forEach(m => {
      if (m.classList.contains('active')) closeModal(m);
    });
  });

  $('emailQuoteBtn').addEventListener('click', () => {
    $('reviewInsuredName').value = quoteState.additionalInformation.insuredName || '';
    $('reviewEmail').value = quoteState.additionalInformation.email || '';
    $('reviewPhone').value = quoteState.additionalInformation.phone || '';
    emailModalOpen();
  });

  $('submitQuoteReviewBtn').addEventListener('click', () => {
    if (!DEV_BYPASS_VALIDATION) {
      const ok = $('reviewInsuredName').value.trim() && $('reviewEmail').value.trim() && $('reviewPhone').value.trim();
      if (!ok) { alert('Please complete all fields.'); return; }
    }
    emailModalClose();
    showToast('A copy of your quote has been emailed to you.');
  });

  $('submitReferralReviewBtn').addEventListener('click', () => {
    if (!DEV_BYPASS_VALIDATION) {
      const ok = $('referralInsuredName').value.trim() && $('referralEmail').value.trim() && $('referralPhone').value.trim();
      if (!ok) { alert('Please complete all fields.'); return; }
    }
    referralModalClose();
    showToast('Thanks — your enquiry has been submitted for review. We will be in touch shortly.');
  });

  function showToast(msg) {
    const toast = $('confirmationToast');
    toast.textContent = msg;
    toast.style.display = 'block';
    // Simple visible toast even off the confirmation screen: fall back to alert if the toast isn't in view.
    if (currentSectionNum !== 8) { alert(msg); toast.style.display = 'none'; }
    else setTimeout(() => { toast.style.display = 'none'; }, 4000);
  }


  // ---------- STEP 6 (progress step 5): YOUR DETAILS (Additional Information) ----------

  function renderAdditionalStep() {
    const a = quoteState.additionalInformation;

    $('additionalFirstName').value = a.firstName;
    $('additionalLastName').value = a.lastName;
    $('additionalEmail').value = a.email;
    $('additionalPhone').value = a.phone;
    $('additionalInterestedParty').value = a.interestedParty;

    if (!insuredNameManuallyEdited) {
      a.insuredName = [a.firstName, a.lastName].filter(Boolean).join(' ');
    }
    $('additionalInsuredName').value = a.insuredName;

    $('residentialAddressHost').innerHTML = `
      <label>Residential Address <span class="required">*</span></label>
      ${addressHtml('residentialAddress', a)}`;

    $('postalAddressHost').innerHTML = `
      <label>Postal Address <span class="optional-label">(if different to above)</span></label>
      ${addressHtml('postalAddress', a, 'Same as residential unless entered')}`;

    if (!postalAddressManuallyEdited && !a.postalAddress) {
      $('postalAddressHost').querySelector('[data-addr-lookup]').placeholder =
        a.residentialAddress ? `Same as residential: ${a.residentialAddress}` : 'Same as residential unless entered';
    }

    renderAdditionalVesselList();
    checkStep6Complete();
  }

  function additionalField(id, value, onInput) {
    return { id, value, onInput };
  }

  $('additionalFirstName').addEventListener('input', e => { quoteState.additionalInformation.firstName = e.target.value; syncInsuredName(); });
  $('additionalLastName').addEventListener('input', e => { quoteState.additionalInformation.lastName = e.target.value; syncInsuredName(); });
  $('additionalInsuredName').addEventListener('input', e => {
    insuredNameManuallyEdited = true;
    quoteState.additionalInformation.insuredName = e.target.value;
    checkStep6Complete();
  });
  $('additionalEmail').addEventListener('input', e => { quoteState.additionalInformation.email = e.target.value; checkStep6Complete(); });
  $('additionalPhone').addEventListener('input', e => { quoteState.additionalInformation.phone = e.target.value; checkStep6Complete(); });
  $('additionalInterestedParty').addEventListener('input', e => { quoteState.additionalInformation.interestedParty = e.target.value; });

  function syncInsuredName() {
    if (!insuredNameManuallyEdited) {
      quoteState.additionalInformation.insuredName =
        [quoteState.additionalInformation.firstName, quoteState.additionalInformation.lastName].filter(Boolean).join(' ');
      $('additionalInsuredName').value = quoteState.additionalInformation.insuredName;
    }
    checkStep6Complete();
  }

  bindAddress($('residentialAddressHost'), () => quoteState.additionalInformation, () => checkStep6Complete());
  bindAddress($('postalAddressHost'), () => { postalAddressManuallyEdited = true; return quoteState.additionalInformation; }, () => checkStep6Complete());

  $('additionalAttachments').addEventListener('change', e => {
    quoteState.additionalInformation.attachments = Array.from(e.target.files).map(f => f.name);
  });

  // Vessel identification, duplicated per boat (Hull Name / Registration / HIN, Mast/Rigging/Sails if
  // sailing, Motor details per motor, Trailer details) — exactly the "Additional Information" screen.
  function additionalVesselHtml(v, i, multi) {
    const d = v.details;
    const a = v.additional || (v.additional = {});
    const sailing = isSailing(d);
    const hasMotor = d.numMotors && d.numMotors !== '0';

    return `
      <div class="additional-vessel-block" data-avessel="${i}">
        ${multi ? `<p class="additional-vessel-heading">Vessel ${i + 1}${d.hullModel ? ` — ${esc(d.hullModel)}` : ''}</p>` : ''}

        <div class="additional-info-grid">
          <div class="additional-field">
            <label>Hull Name</label>
            <input type="text" data-avfield="hullName" value="${esc(a.hullName || '')}">
          </div>
          <div class="additional-field">
            <label>Hull Registration Number</label>
            <input type="text" data-avfield="hullRegNumber" value="${esc(a.hullRegNumber || '')}">
          </div>
          <div class="additional-field">
            <label>Hull Identification Number (HIN)</label>
            <input type="text" data-avfield="hin" value="${esc(a.hin || '')}">
          </div>

          ${sailing ? `
            <div class="additional-field">
              <label>Mast Year</label>
              <input type="number" data-avfield="mastYear" placeholder="YYYY" value="${esc(a.mastYear || '')}">
            </div>
            <div class="additional-field">
              <label>Rigging Type</label>
              <select data-avfield="riggingType">
                <option value="" disabled ${a.riggingType ? '' : 'selected'}>Select</option>
                ${RIGGING_TYPES.map(o => `<option value="${o}" ${a.riggingType === o ? 'selected' : ''}>${o}</option>`).join('')}
              </select>
            </div>
            <div class="additional-field">
              <label>Rigging Year</label>
              <input type="number" data-avfield="riggingYear" placeholder="YYYY" value="${esc(a.riggingYear || '')}">
            </div>
            <div class="additional-field">
              <label>Sails Material</label>
              <input type="text" data-avfield="sailsMaterial" value="${esc(a.sailsMaterial || '')}">
            </div>
            <div class="additional-field">
              <label>Sails Year</label>
              <input type="number" data-avfield="sailsYear" placeholder="YYYY" value="${esc(a.sailsYear || '')}">
            </div>` : ''}

          ${hasMotor ? `
            <div class="additional-field">
              <label>Motor Model</label>
              <input type="text" data-avfield="motorModel" value="${esc(a.motorModel || '')}">
            </div>
            <div class="additional-field">
              <label>Motor Year Built</label>
              <input type="number" data-avfield="motorYearBuilt" placeholder="YYYY" value="${esc(a.motorYearBuilt || '')}">
            </div>
            <div class="additional-field">
              <label>Motor Horsepower</label>
              <input type="number" data-avfield="motorHorsepower" min="0" value="${esc(a.motorHorsepower || '')}">
            </div>
            <div class="additional-field">
              <label>Motor Serial Number</label>
              <input type="text" data-avfield="motorSerial" value="${esc(a.motorSerial || '')}">
            </div>` : ''}

          <div class="additional-field">
            <label>Do you have trailer(s) to insure with the vessel(s)?</label>
            <select data-avfield="hasTrailer">
              <option value="" disabled ${a.hasTrailer ? '' : 'selected'}>Select</option>
              <option value="No" ${a.hasTrailer === 'No' ? 'selected' : ''}>No</option>
              <option value="Yes" ${a.hasTrailer === 'Yes' ? 'selected' : ''}>Yes</option>
            </select>
          </div>

          ${a.hasTrailer === 'Yes' ? `
            <div class="additional-field">
              <label>Trailer Make &amp; Model</label>
              <input type="text" data-avfield="trailerMakeModel" value="${esc(a.trailerMakeModel || '')}">
            </div>
            <div class="additional-field">
              <label>Trailer Year Built</label>
              <input type="number" data-avfield="trailerYearBuilt" placeholder="YYYY" value="${esc(a.trailerYearBuilt || '')}">
            </div>
            <div class="additional-field">
              <label>Trailer Registration Number</label>
              <input type="text" data-avfield="trailerRegNumber" value="${esc(a.trailerRegNumber || '')}">
            </div>` : ''}
        </div>
      </div>`;
  }

  function renderAdditionalVesselList() {
    const multi = quoteState.vessels.length > 1;
    $('additionalVesselList').innerHTML = quoteState.vessels.map((v, i) => additionalVesselHtml(v, i, multi)).join('');
  }

  $('additionalVesselList').addEventListener('input', onAdditionalVesselInput);
  $('additionalVesselList').addEventListener('change', ev => {
    onAdditionalVesselInput(ev);
    if (ev.target.dataset.avfield === 'hasTrailer') renderAdditionalVesselList();
  });

  function onAdditionalVesselInput(ev) {
    const el = ev.target;
    if (!el.dataset.avfield) return;
    const i = Number(el.closest('[data-avessel]').dataset.avessel);
    quoteState.vessels[i].additional[el.dataset.avfield] = el.value;
  }

  function isAdditionalComplete() {
    const a = quoteState.additionalInformation;
    return !!(a.firstName && a.lastName && a.email && a.phone && (a.residentialAddress && a.residentialAddress.trim()));
  }

  function checkStep6Complete() {
    if (DEV_BYPASS_VALIDATION) { $('continueBtn6').disabled = false; return; }
    $('continueBtn6').disabled = !isAdditionalComplete();
  }


  // ---------- STEP 7 (progress step 6): PAYMENT ----------

  function populatePaymentSelects() {
    $('paymentCardType').innerHTML =
      '<option value="" disabled selected>Select</option>' +
      CARD_TYPES.map(c => `<option value="${c.value}">${esc(c.label)}</option>`).join('');

    $('paymentExpiryMonth').innerHTML =
      '<option value="" disabled selected>Select</option>' +
      Array.from({ length: 12 }, (_, i) => pad(i + 1)).map(m => `<option value="${m}">${m}</option>`).join('');

    const startYear = new Date().getFullYear();
    $('paymentExpiryYear').innerHTML =
      '<option value="" disabled selected>Select</option>' +
      Array.from({ length: 11 }, (_, i) => startYear + i).map(y => `<option value="${y}">${y}</option>`).join('');
  }
  populatePaymentSelects();

  function currentTotals() {
    return quoteState._combined || combineQuote();
  }

  function renderPaymentMethodStep() {
    const combined = currentTotals();
    $('instalmentOptionText').textContent =
      combined.allCategorised ? `Pay in ${INSTALMENTS} monthly instalments of ${money(combined.instalment)}` : `Pay in ${INSTALMENTS} monthly instalments`;

    $('paymentPremiumHost').innerHTML = `
      <div class="quote-premium-panel">
        <div class="quote-premium-total">
          <span>Total Premium Payable</span>
          <span>${money(combined.totalPremium)}</span>
        </div>
      </div>`;

    $('paymentMethodSelection').style.display = '';
    $('paymentEntrySection').style.display = 'none';

    qsa('.payment-method-option').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.paymentMethod === quoteState.payment.method);
    });
    $('continueToPaymentBtn').disabled = DEV_BYPASS_VALIDATION ? false : !quoteState.payment.method;
  }

  qsa('.payment-method-option').forEach(btn => {
    btn.addEventListener('click', () => {
      quoteState.payment.method = btn.dataset.paymentMethod;
      qsa('.payment-method-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      $('continueToPaymentBtn').disabled = false;
    });
  });

  $('continueToPaymentBtn').addEventListener('click', () => {
    $('paymentMethodSelection').style.display = 'none';
    $('paymentEntrySection').style.display = 'block';
    renderPaymentEntry();
  });

  $('paymentEntryBackBtn').addEventListener('click', () => {
    $('paymentEntrySection').style.display = 'none';
    $('paymentMethodSelection').style.display = '';
  });

  function renderPaymentEntry() {
    const combined = currentTotals();
    const p = quoteState.payment;

    $('paymentCardType').value = p.cardType;
    $('paymentCardholderName').value = p.cardholderName;
    $('paymentCardNumber').value = p.cardNumber;
    $('paymentExpiryMonth').value = p.expiryMonth;
    $('paymentExpiryYear').value = p.expiryYear;
    $('paymentCCV').value = p.ccv;

    const amountDue = p.method === 'instalments' ? combined.instalment : combined.totalPremium;
    const cardMeta = CARD_TYPES.find(c => c.value === p.cardType);
    const surcharge = cardMeta ? round2(amountDue * cardMeta.rate) : 0;

    $('paymentTotalStrip').innerHTML = `
      <div class="payment-total-row"><span>${p.method === 'instalments' ? 'Instalment Amount' : 'Amount Due Today'}</span><span>${money(amountDue)}</span></div>
      ${cardMeta ? `<div class="payment-total-row payment-total-row-muted"><span>Card Surcharge (${cardMeta.label.match(/\(([^)]+)\)/)[1]})</span><span>${money(surcharge)}</span></div>` : ''}
      <div class="payment-total-row payment-total-row-final"><span>Total Paid Including Surcharge</span><span>${money(round2(amountDue + surcharge))}</span></div>`;

    checkPaymentEntryComplete();
  }

  ['paymentCardType', 'paymentCardholderName', 'paymentCardNumber', 'paymentExpiryMonth', 'paymentExpiryYear', 'paymentCCV'].forEach(id => {
    $(id).addEventListener('input', onPaymentEntryChange);
    $(id).addEventListener('change', onPaymentEntryChange);
  });

  function onPaymentEntryChange(e) {
    const map = {
      paymentCardType: 'cardType', paymentCardholderName: 'cardholderName', paymentCardNumber: 'cardNumber',
      paymentExpiryMonth: 'expiryMonth', paymentExpiryYear: 'expiryYear', paymentCCV: 'ccv'
    };
    quoteState.payment[map[e.target.id]] = e.target.value;
    renderPaymentEntry();
  }

  function isPaymentComplete() {
    const p = quoteState.payment;
    return !!(p.cardType && p.cardholderName && p.cardNumber && p.expiryMonth && p.expiryYear && p.ccv);
  }

  function checkPaymentEntryComplete() {
    const disabled = DEV_BYPASS_VALIDATION ? false : !isPaymentComplete();
    $('payNowBtn').disabled = disabled;
    $('requestPaymentLinkBtn').disabled = false;
  }

  $('cancelPaymentBtn').addEventListener('click', () => {
    quoteState.payment.method = '';
    renderPaymentMethodStep();
  });

  $('requestPaymentLinkBtn').addEventListener('click', () => {
    showToast('A secure payment link has been sent to your email address.');
  });

  $('payNowBtn').addEventListener('click', () => {
    if (!DEV_BYPASS_VALIDATION && !isPaymentComplete()) return;
    processPayment();
  });


  // ---------- CONFIRMATION ----------
  function processPayment() {
    const combined = currentTotals();
    const p = quoteState.payment;
    const cardMeta = CARD_TYPES.find(c => c.value === p.cardType);
    const amountDue = p.method === 'instalments' ? combined.instalment : combined.totalPremium;
    const surcharge = cardMeta ? round2(amountDue * cardMeta.rate) : 0;
    const last4 = (p.cardNumber || '').replace(/\D/g, '').slice(-4) || '0000';

    quoteState.policy = {
      policyNumber: `TPCP-${Math.floor(100000 + Math.random() * 900000)}`,
      insuredName: quoteState.additionalInformation.insuredName || '—',
      startDate: quoteState.yourQuote.policyStartDate,
      endDate: quoteState.yourQuote.policyEndDate,
      amountPaid: round2(amountDue + surcharge),
      cardLabel: cardMeta ? cardMeta.label.split(' (')[0] : '—',
      last4,
      paymentDate: toInputDate(new Date())
    };

    renderConfirmation();
    goToSection(9);
  }

  function renderConfirmation() {
    const pol = quoteState.policy;
    if (!pol) return;

    $('confirmationEmailNote').textContent =
      `A confirmation email with your receipt and Certificate of Currency has been sent to ${quoteState.additionalInformation.email || 'your email address'}.`;

    $('policySummaryList').innerHTML = [
      ['Policy Number', pol.policyNumber],
      ['Policy Type', 'Legal Liability Only'],
      ['Policyholder', pol.insuredName],
      ['Period of Insurance', `${formatDate(pol.startDate)} — ${formatDate(pol.endDate)}`]
    ].map(([l, v]) => `<div class="summary-row"><span class="summary-label">${l}</span><span class="summary-value">${esc(v)}</span></div>`).join('');

    $('paymentSummaryList').innerHTML = [
      ['Amount Paid', money(pol.amountPaid)],
      ['Payment Method', `${pol.cardLabel} ending in ${pol.last4}`],
      ['Payment Date', formatDate(pol.paymentDate)]
    ].map(([l, v]) => `<div class="summary-row"><span class="summary-label">${l}</span><span class="summary-value">${esc(v)}</span></div>`).join('');
  }

  $('homeBtn').addEventListener('click', () => { window.location.href = 'products.html'; });
  $('receiptBtn').addEventListener('click', () => showToast('Your receipt has been emailed to you.'));
  $('certificateBtn').addEventListener('click', () => showToast('Your Certificate of Currency has been emailed to you.'));


  // ---------- NAVIGATION ----------
  function updateProgressBar(sectionNum) {
    const step = sectionNum - 1; // tp-step-2 => progress step 1 ... tp-step-7 => progress step 6
    const show = step >= 1 && step <= totalProgressSteps;
    progressBar.style.display = show ? '' : 'none';
    if (!show) return;

    qsa('.progress-step', progressBar).forEach(el => {
      const n = Number(el.dataset.step);
      el.classList.toggle('active', n === step);
      el.classList.toggle('completed', n < step);
    });
    qsa('.progress-line', progressBar).forEach((el, i) => {
      el.classList.toggle('completed', (i + 1) < step);
    });
  }

  function goToSection(n) {
    currentSectionNum = n;
    qsa('.quote-step').forEach(sec => { sec.style.display = 'none'; });
    $(`tp-step-${n}`).style.display = '';
    updateProgressBar(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (n === 2) renderQuestions();
    if (n === 3) renderVesselStep();
    if (n === 4) renderExperienceStep();
    if (n === 5) {
      renderAdditionalBoats();
      checkAdditionalBoatsComplete();
    }

    if (n === 6) {
      renderQuoteStep();
    }

    if (n === 7) {
      renderAdditionalStep();
    }

    if (n === 8) {
      renderPaymentMethodStep();
    }

    if (n === 9) {
      renderConfirmation();
    }
  }
// ---------- CLICKABLE PROGRESS BAR ----------

progressBar
  .querySelectorAll('.progress-step')
  .forEach(step => {

    step.style.cursor = 'pointer';

    step.addEventListener('click', () => {
      const targetProgressStep =
        Number(step.dataset.step);

      const targetSection =
        targetProgressStep + 1;

      if (DEV_BYPASS_VALIDATION) {
        goToSection(targetSection);
        return;
      }

      if (targetSection <= currentSectionNum) {
        goToSection(targetSection);
      }
    });

  });
  // ----- Intro -----
  $('dutyAgreement').addEventListener('change', e => {
    $('getStartedBtn').disabled = !e.target.checked;
  });
  $('getStartedBtn').addEventListener('click', () => goToSection(2));

  // ----- TMD -> Vessel Details (decline gate) -----
  $('backBtn2').addEventListener('click', () => goToSection(1));
  $('continueStep2Btn').addEventListener('click', () => {
    const declineReasons = getDeclineReasons();
    if (declineReasons.length) {
      declineModalOpen();
      return; // decline always blocks, even with DEV_BYPASS_VALIDATION — it is a hard eligibility rule
    }
    goToSection(3);
  });

  // ----- Vessel Details -----
  $('backBtn3').addEventListener('click', () => goToSection(2));
  $('continueStep3Btn').addEventListener('click', () => goToSection(4));

  // ----- Experience & History -----

  $('backBtn4').addEventListener(
    'click',
    () => goToSection(3)
  );

  $('continueBtn4').addEventListener(
    'click',
    () => goToSection(5)
  );


  // ----- Additional Boats -----

  $('backAdditionalBoatsBtn')
    .addEventListener(
      'click',
      () => goToSection(4)
    );

  $('continueAdditionalBoatsBtn')
    .addEventListener(
      'click',
      () => goToSection(6)
    );


  // ----- Your Quote -----

  $('backBtn5').addEventListener(
    'click',
    () => goToSection(5)
  );

  $('continueBtn5').addEventListener(
    'click',
    () => {
      const { referReasons } =
        allReferralReasons();

      if (referReasons.length) {
        $('referralInsuredName').value =
          quoteState.additionalInformation
            .insuredName || '';

        $('referralEmail').value =
          quoteState.additionalInformation
            .email || '';

        $('referralPhone').value =
          quoteState.additionalInformation
            .phone || '';

        referralModalOpen();
        return;
      }

      goToSection(7);
    }
  );


  // ----- Your Details -----

  $('backBtn6').addEventListener(
    'click',
    () => goToSection(6)
  );

  $('continueBtn6').addEventListener(
    'click',
    () => goToSection(8)
  );


  // ----- Payment -----

  $('backBtn7').addEventListener(
    'click',
    () => goToSection(7)
  );


  // ---------- PDS LINKS ----------
  $('pdsLinkIntro').href = PDS_URL;
  $('pdsLinkQuote').href = PDS_URL;


  // ---------- INIT ----------
  goToSection(1);

});
