if (sessionStorage.getItem('coastAuthed') !== 'true') {
  window.location.replace('index.html');
}

document.addEventListener('DOMContentLoaded', () => {
  // Change to false before production.
  const DEV_BYPASS_VALIDATION = true;

  const progressBar =
    document.getElementById('progressBar');

  const dutyAgreement =
    document.getElementById('dutyAgreement');

  const getStartedBtn =
    document.getElementById('getStartedBtn');

  const continueStep2Btn =
    document.getElementById('continueStep2Btn');

  const continueStep3Btn =
    document.getElementById('continueStep3Btn');

  const declineModal =
    document.getElementById('declineModal');

    const quoteState = {
    importantInfo: {},
    vesselDetails: {},
    referralRequired: false,
    referralReasons: [],

    experienceHistory: {
    numOwners: '',
    numSkippers: '',
    skippers: [],
    past5Years: {},
    claims: [],
    ever: {}
    },

    hasAdditionalBoats: '',
    additionalBoats: []
    };
  // ==================================================
  // PAGE 1: TARGET MARKET DETERMINATION
  // ==================================================

  const questions = [
    {
      id: 'q1',
      text: 'The Vessel(s) will be owned by the applicant/You for the duration of the policy.',
      type: 'toggle'
    },
    {
      id: 'q2',
      text: 'The Vessel(s) is not used for financial reward or registered as a commercial vessel.',
      type: 'toggle'
    },
    {
      id: 'q3',
      text: 'The Vessel(s) will not operate outside of Australian or New Zealand waters or the waters located between the two countries.',
      type: 'toggle'
    },
    {
      id: 'q4',
      text: 'The Vessel(s) will not be under construction (other than being refitted) at any time during the insurance period and the Vessel(s) has been launched.',
      type: 'toggle'
    },
    {
      id: 'q5',
      text: 'The Vessel(s) to be insured under this insurance is not registered or zoned as a building (for example, a floating office).',
      type: 'toggle'
    },
    {
      id: 'q6',
      text: 'The Vessel(s) is not used for permanent accommodation (agreement available upon request).',
      type: 'toggle'
    },
    {
      id: 'q7',
      text: 'The Vessel(s) is not used for Timeshare Arrangement / Syndicate / Equity Arrangement.',
      type: 'toggle'
    },
    {
      id: 'q8',
      text: 'The Vessel(s) is not used for Holiday Rental / Air B&B Holiday Rental / Air B&B.',
      type: 'toggle'
    },
    {
      id: 'q9',
      text: 'The Vessel(s) is seaworthy.',
      type: 'toggle'
    },
    {
      id: 'q10',
      text: 'What is the maximum capable speed of the Vessel(s)? Please answer in regards to the fastest Vessel if applying to insure more than one.',
      type: 'select',
      options: [
        'Up to 40 Knots / 75 kph',
        '40-60 Knots / 75-110 kph',
        'Over 60 Knots / 110 kph'
      ]
    }
  ];

  function renderQuestions() {
    const questionList =
      document.getElementById('questionList');

    questionList.innerHTML = questions.map(question => {
      if (question.type === 'select') {
        return `
          <div
            class="question-row"
            data-qid="${question.id}"
          >
            <p class="question-text">
              ${question.text}
            </p>

            <select
              class="question-select"
              data-qid="${question.id}"
            >
              <option value="" disabled selected>
                Select
              </option>

              ${question.options.map(option => `
                <option value="${option}">
                  ${option}
                </option>
              `).join('')}
            </select>
          </div>
        `;
      }

      return `
        <div
          class="question-row"
          data-qid="${question.id}"
        >
          <p class="question-text">
            ${question.text}
          </p>

          <div class="question-toggle">
            <button
              type="button"
              class="toggle-btn"
              data-value="true"
            >
              True
            </button>

            <button
              type="button"
              class="toggle-btn"
              data-value="false"
            >
              False
            </button>
          </div>
        </div>
      `;
    }).join('');

    questionList
      .querySelectorAll('.toggle-btn')
      .forEach(button => {
        button.addEventListener('click', () => {
          const row =
            button.closest('.question-row');

          const questionId =
            row.dataset.qid;

          row
            .querySelectorAll('.toggle-btn')
            .forEach(toggle => {
              toggle.classList.remove('selected');
            });

          button.classList.add('selected');

          quoteState.importantInfo[questionId] =
            button.dataset.value;

          checkStep2Complete();
        });
      });

    questionList
      .querySelectorAll('.question-select')
      .forEach(select => {
        select.addEventListener('change', () => {
          quoteState.importantInfo[select.dataset.qid] =
            select.value;

          checkStep2Complete();
        });
      });
  }

  function checkStep2Complete() {
    if (DEV_BYPASS_VALIDATION) {
      continueStep2Btn.disabled = false;
      return;
    }

    const answeredQuestions =
      Object.keys(quoteState.importantInfo).length;

    continueStep2Btn.disabled =
      answeredQuestions < questions.length;
  }

  function hasDeclineResponse() {
    const declineQuestions = [
      'q1',
      'q2',
      'q3',
      'q4',
      'q5',
      'q7',
      'q8',
      'q9'
    ];

    const falseResponse =
      declineQuestions.some(questionId =>
        quoteState.importantInfo[questionId] === 'false'
      );

    const speedDecline =
      quoteState.importantInfo.q10 ===
      'Over 60 Knots / 110 kph';

    return falseResponse || speedDecline;
  }

  function updateReferralState() {
    quoteState.referralRequired =
      quoteState.importantInfo.q6 === 'false';

    quoteState.referralReasons =
      quoteState.referralRequired
        ? ['Permanent accommodation']
        : [];
  }

  // ==================================================
  // PAGE 2: VESSEL DETAILS
  // ==================================================

  const hullMakeOptions = `
29er
49er
Ab Inflatables
Absolute
Ac Barber Design
Ac Marine
Academy
Achilles
Action Craft
Adams
Adams Marine
Adria
Adventure Yachts
Aicon
Air Rider
Al Dhaen
Alan Payne
Alaska
Albo Marine
Alden
Alf Stessl
Allison
Allseas Yachts
Ally Craft
Aloha
Alubat
Alucraft
Aluminium Longboats
Aluvan
Amanda
Amara Boats
Amel
Amphibious
Angel
Anglapro
Apex
Apreamare
Aqualine
Aquamaster
Aquapro
Aquarius
Aquascape
Aquasport
Aquavan
Aquila
Archambault
Archer
Arrowcat
Arvor
Asi
Assassin
Atkinson
Atlas Boat Works Usa
Atlas Boats
Atomix
Aurora
Ausboating
Aussie Whaler
Austral
Austral Marine
Australian Marine
Aventura Catamarans
Axis By Malibu
Axopar
Azimut
Aztecraft
Azuree
Azzura
Back Cove
Bahama
Baia
Baja
Bakewell-White
Bakri Cono
Baldwin Boats
Bali Catamarans
Bancroft Bay
Bar Crusher
Baron
Baroness
Barrington
Bass Boat
Bass Strait
Bateau
Bavaria
Bay Cruiser
Bayliner
Baysport
Beachcraft
Beastmaster Boats
Belize
Bella
Bellboy
Belvedere
Beneteau
Benetti
Bennington
Bering
Bermuda
Bernico
Bertram
Bertram Caribbean
Bfg
Bg Boatbuilding
Big Duck
Bill Fisher
Bingstar
Black Watch
Blackdog Cat
Blackfin Boats
Blue Seas
Blue Water
Bluefin
Blueline
Boat A Home
Bonbridge
Bonito
Boomerang
Boro
Boston Whaler
Botin & Carkeek
Boyer
Brabus Marine
Brady
Brewer
Brig
Brinovo
Brolga
Brooker
Broward
Brown Brothers
Bruce Harris
Bruce Roberts
Buccaneer
Buizen
Bullet
Cabo
Cairns Custom Craft
Calabria
Calibre
Camcraft
Camero
Campion
Cantiere Delle Marche
Cantieri Di Pisa
Cantieri Di Sarnico
Cantieri Magazzu
Cape
Capelli
Caporn
Caravelle
Carbineer
Careel
Carey
Caribbean
Caribbean Bertram
Carolina Classic
Carrera
Carter
Carvel
Carver Yachts
Catalina Yachts
Catana
Catathai
Cavalier
Cayzer
Cdmarine
Celebrity
Centurion
Century
Chadwick Boats
Chamberlin
Chaparral
Charter
Cheoy Lee
Chivers
Chivers Marine
Chris Craft
Cigarette
Circa
Clansman
Clark
Clarke
Classic
Clayton
Cleveland
Clinker
Clipper
Cnb Yachts
Cnc Marine
Coastal Cat
Coaster
Cobalt
Cobia
Coher
Cole
Colin Smith
Colombo Yachts
Columbia
Colvin (Thomas Colvin)
Comet
Commodo
Com-Pac
Compass
Concept
Conquest
Contender
Contest Yachts
Cooke Nz
Cooke Yachts
Cookson
Cooper
Cootacraft
Coral Coast
Coraline
Corby
Coronado
Coronet
Couach
Cougar
Court
Couta Boat
Coxcraft
Cranchi
Creelcraft
Crest Pontoons
Cresta
Crestliner
Crestrida
Crestrunner
Cross X Country
Crossfire
Crowley
Crownline
Crowther
Cruise Craft
Cruisers Yachts
Crusader
Current
Cutter
Cyclone
Dan Leech
David Young
Davidson
Daydream
De Antonio Yachts
De Havilland
Deep V
Defever
Dehler
Deltabay
Dennis
Devilcat
Diamond
Dk Yachts
DNA Performance Sailing
Dominator
Don Brooke
Donzi
Dorado
Doral
Dovell
Doven
Dragon
Dragonfly
Dreamcatcher
Dromeas Yachts
Dubois
Duck Flat Wooden Boats
Dufour Yachts
Duncanson
Dyna
Dynamic
Dynamiq
Eagle Catamarans
Eastcoast
Easy Rider
Ebbtide
Ed Monk
Edencraft
Edgewater
Elan
Elliott
Endeavour
Endurance
Enlightened Boating
Enterprise
Epic
Etchells
Everglades
Everingham
Evo
Evo Yachts
Evolution
Excess Catamarans
Expedition
Explorer
Express
Extreme
Fairline
Fairway
Falcon
Falmouth
Far North Fabrication
Fareast
Farr
Farrier
Fast
Fastback
Fastlane
Feadship
Feathercraft
Ferretti
Ferry
Fibrafort
Fibremaster
Fi-Glass
Filam Ski Boats
Fine Entry
Finn
Fisher
Fjord
Fleming
Flightcraft
Flipper Boats
Flying Fifteen
Flying Tiger
Focus Motor Yachts
Folkboat
Force
Formosa
Formula
Foundation
Fountaine Pajot
Four Seasons
Four Winns
Fraser
Frauscher
Fred Fleming
Freedom
Freeman Bay
Fury
Fusion
G Boats
G&S Boats
Gaff Rigged
Galeon Yachts
Ganley
Garcia
Garnet Boats
Gavin Mair
Gbb
GEM
Gemini
Geta
Gilbert Caroff
Gilcraft
Gilflite
Glacier Bay
Glastron
Glen L Marine
Global Marine
Gold Coast Ships
Gold Island
Goldstar
Goolwacraft
Gospel
Gozzo Schiaffino
Gp Engineering
Gr Pontoon
Grady-White
Grainger
Grand Banks
Grand Soleil
Greenline
Greg Young
Griffin
Gulf Craft
Gulfstar
Gunfleet
Gunner Cardell
Guy Couach
Haines
Hallberg-Rassy
Hallett
Halvorsen
Hammerhead
Hampton
Hankinson
Hans Christian
Hanse
Haoyun
Hargrave
Harold Springs
Harris
Harriscraft
Hartley
Hatteras
Havana
Hcb Yachts
Heesen Yachts
Heliotrope
Herreshoff
Hershine
Hewes
Heysea
Hi Star
High Seas
Highfield
Hoek
Holland
Holman
Holmes
Homecruiser
Hooker
Horace Tate
Horizon
Horizon Yacht
Hugh Morris
Humphreys Yacht Design
Hunter Marine
Hunter Yachts
Huntsman
Hurricane
Hutton
Hydra Cat
Hydra-Sports
Hydrofield
Hydrotec
Hylas
ILCA
Illusions
Iluka Yachts
Image
Imexus
IMP
Inace
Incat Crowther
Inglis
Integrity
International
International Cadet
Intrepid
Invincible Boats
Island Gypsy
Island Inflatables
Island Packet
Island Spirit Catamaran
Islander
Italboats
Italia Yachts
Itama
J Boats
Jackaroo
Jackman
Jade Yachts
Jarkan
Javelin
Jbs Marine
Jeanneau
Jemison Motor Yacht
Jenks Craft
John Dengate
John Pugh
Joker Boat
Jomo Boats
Jp Marine
Jpk Pacific
Kaizen
Kaos
Kellick
Kelsall
Ker
Kevlacat
Key West
Kingcat
Kingfisher
Kingship
Kingston
Kinocean
Kiwi Kraft
Kleise
Kong Halvorsen
Koolyn
Koster
Kuipers Doggersbank
Kwikkraft
Lagoon
Laguna
Lancer
Larc
Larson
Laser
Laurent Giles
Lazzara
Lct
Leeder
Legend Boats
Leisurecat
Leonardo Yachts
Leopard
Leopard Catamarans
Lewis
Lidgard
Lightwave
Lightwave Yachts
Liya
Lloyd
Lomac
Longreef Yachts
Lou Farrell
Ltn
Luhrs
Lyndcraft
Lyons
Mac Boats
MacGregor
Mackay Boats
Mad Dog Boats
Magnum
Maiora
Majesty Yachts
Mako
Makocraft
Malibu
Mancraft
Mangrove Jack
Mangusta
Manitou
Manta
Marauder
Marex
Mariah
Mariner
Maritimo
Mark Ellis Design
Markham
Markline
Marko
Marlin
Marlin Broadbill
Marquis
Marshall Lord
Marten
Masrm
Mastercraft
Matrix
Maurice Griffiths
Maverick
Maxum
Mcalpine Marine Design
Mcconaghy
Mclay
Mec
Mediterranean
Melges
Mercury
Meridian
Mg
Midland Marine
Miller And Whitworth
Millkraft
Millman
Minnow
Mirror
Misty Harbor
Moby
Mochi Craft
Moda
Monark
Monte Carlo
Monte Fino
Monterey
Moody
Moomba
Moonen
Moreton
Morningstar
Morrelli & Melvin
Motor Guide
Mottle
Murray Burns & Dovell
Mustang
Naiad
Nankervis
Nantucket
Nautica
Nauticat
Nauticstar Usa
Nautiglass
Nautique
Nautitech
Nautor Swan
Navigator
Naya
Neel Trimarans
Nereus
Nesscraft
New Ocean Yachts
New Zealand Plate Boats
New Zealand Yachts
Newport
Nimbus
Nitro
Noelex
Nomad Yachts
Noosa Cat
Nordhavn
Nordic
Norman Wright
North Harbour Motor Yachts
Northbank
Northern Star
Northshore
Norwalk Islands Sharpies
Novamarine
Novatec
Novurania
Nq Borger Cat
Numarine
Nuova Jolly
O'Brien
OC
Ocean Alexander
Ocean Cylinder
Ocean Master
Ocean Max
Ocean Voyager
Ocean Whaler
Ocean Yachts
Oceaneer
Oceanic
Oceantech
Offshore
Offshore NZ
OK Dinghy
O'PEN
Optimist
Oram
Origin
Orion
Oromarine
Oryx Yachts
Outlaw
Outremer
Ovington
Owens
Ozycat
Pacemaker
Pachoud
Pacific
Pacific Pontoons
Pacific Sportfish
Palm Beach Motor Yachts
Pan Oceanic
Panorama
Paragon
Pardo Yachts
Parker
Pathfinder
Pearl Yachts
Pegasus
Pegiva
Penguin
Performance Plate Boats
Perry
Pershing
Pescott
Peter Milner
Phantom
Phibicat
Phil Curran
Pioneer
Pirate
Pirelli Pzero
Pirelli Tecnorib
Platemaster
Pleysier
Polar Kraft
Polycraft
Pompei
Pongrass
Porta-Bote
Post
PowerCat Marine
Powercraft
Precision
Predator
Premier
President
Prestige
Preston
Preston Craft
Pride
Princess
Privilege
Pro Plate Boats
Proceans
Pro-Line
Protector
Prout
Puccini Yachts
Purekraft Boats
Pursuit
Qingdao
Quantum Cat
Quarken
Queens
Quicksilver
Quicksilver Inflatables
Quintrex
Radar
Radford
Rae Line
Rafnar
Ramco
Rampage
Ramsay
Rand Boats
Randall
Randell
Ranger
Ranger Tugs
Ranieri
Raptor
Rayglass
Raymond Hunt Design
Razerline
Rebel Boats
Redfin
Redline
Reflex
Regal
Regent
Regulator
Reichel Pugh
Reinell
Rencraft
Renken
Revival
Rex Norton
Rhea
RIB Force
Ribbon
Richmond
Rinker
Rip Tide
Riva
Riviera
Rizzardi
Robalo
Robert Clarke
Roberts
Robertson
Roger Hill
Rolco
Ross
Roughneck
Royal Denship
RS Sailing
Runnalls
Sable Marine
Sabre
Sacs Marine
Saga Yachts
Sailfish
Salacia Yachts
Salar
Salem
Salona
Salthouse
Saltwater Commercial Workboats
Samson
Sanlorenzo
Santana
Sasga Yachts
Savage
Saxdor Yachts
Sbf Shipbuilders
Scarab
Schaaf
Schaefer Yachts
Scheepswerf Van Duivendijk
Schionning
Schock
Scimitar
Scorpion
Scott Robson
Scout
Scruffie
Sea Austral
Sea Cat
Sea Change Boating
Sea Chaser
Sea Crest
Sea Dogger
Sea Flight
Sea Fox
Sea Hunter
Sea Jay
Sea Pro
Sea Ranger
Sea Ray
Sea Storm
Sea Tiger
Seabreeze
Seacraft
Seacruiser
Sea-Doo
Seafarer
Seahorse
Seaking
Sealegs
Sealine
Sealver
Seamaster
Seaquest
Seascape
Seaswirl
Seatamer
Seatech
Seatime
Seaview
Seawind
Seeker Pontoon Boats
Selene
Senator
Sensation
Sessa
Shamrock
Shark Cat
Sharkcat
Sharpie
Shepirocraft
Silent Yachts
Silver Arrows Marine
Silvercraft
Silverline
Silverton
Simonis
Simpson
Sirena Yachts
Sirocco
Skater
Skeeter
Ski Hi
Skibsplast
Skicraft
Skiline
Sleekline
Slockscraft
Smartwave
Smuggler
Snyper
Solaris
Solaris Power
Sonata
Sossego
South Coast
South Pacific
Southbound Boats
Southerly
Southern Cross
Southern Formula
Southern Pacific
Southern Star
Southland
Southwind
Sovereign
Spacesailer
Sparkman & Stephens
Spearfish
Spirited
Sportcraft
Sportscraft
Sportsman
Sportsman Boats
Sportsman Craft
Spy Boats
Spydercraft
Stabicraft
Stacer
Stagg
Star Boats
Starcraft
Stealth
Steber
Stebercraft
Stejcraft
Stephens
Stessco
Stessl
Steve Ward
Stevens
Stingray
Stoner Boatworks
Strategic Marine
Stratos
Streaker
Streamline Catamarans
Striker
Success Craft
Sun Tracker
Sun Yachts
Sunbird
Sunchaser
Sundance
Sunliner Boats
SunQuest Boats Australia
Sunreef Yachts
Sunrunner
Sunsation
Sunseeker
Super Cat
Super Trac
Supra
Supreme
Sur Marine
Surtees
Swanson
Swarbrick
Swarbrick & Swarbrick
Sweetwater
Swift Craft
Sydney
Sydney Yachts
Symbol
Tabs
Tahoe
Tailored Marine
Taipan
Takacat
Talamex
Tasmanian
Tayana
Taylor
Te Cat
Technohull
Telwater
Temptress
Tennessee
Terrara
Thomascraft
Thompson
Tiara
Tidal Marine
Tidewater
Tige
Tiger Marine
Timpenny
Titan
Tofinou
Top Hat
Topaz
Topper
Tornado
Tournament
Tp
Tracker
Traditional
Trailcraft
Trailer
Trekka
Tri Star
Trident
Trinity Yachts
Triumph
Trophy
Tumlaren
Turncraft
UFO
Ultimate
Universal
Valhalla
Van De Stadt
Van Dieman Seaman
Van Diemen Luxury Craft
Vancouver
Vandutch
Vanquish Yachts
Vasard
Veitch
Venom
Veranda Pontoons
Versilcraft
Vickers
Viking Boats
Viking Yachts
Vmax
Volvo
Voyager
Wade Craft
Walker
Warren
Warwick
Waszp
Watermark Marine
Wauquiez
Wavelength
Websters Twinfisher
Wellcraft
Wells
Wescraft
Westcoaster
Westerberg
Westport
Whisper Boats
White Cap
White Pointer
Whitehaven
Whittley
Wider
Wildsea
William Atkins
William Fife
Williams
Wilson
Windrush
Woody Marine
Woollacott
World Cat
Xcat
Xfi
Xo Boats
Xpress Boats
Xpression
Xtreme Marine
X-Yachts
Y Yachts
Yalta
Yalta Craft
Yamaha Boats
Yamba
Yanmar
Yeld Cat Marine
Yellowfin
Young
Young Craft
Zar Formenti
Zar Mini
Zego
Zenith
Ziegelmayer
Zodiac
Zodiac Milpro
Zulu Cat
Other
`
  .trim()
  .split('\n')
  .map(option => option.trim())
  .filter(Boolean);


  const vesselFields = [
    {
    id: 'hullMake',
    label: 'Hull Make',
    type: 'select',
    options: hullMakeOptions,
    specifyValues: ['Other']
    },
    {
      id: 'hullModel',
      label: 'Hull Model',
      type: 'text',
      placeholder: 'Enter hull model'
    },
    {
      id: 'hullYearBuilt',
      label: 'Hull Year Built',
      type: 'number',
      placeholder: 'YYYY'
    },
    {
      id: 'hullConstruction',
      label: 'Hull Construction',
      type: 'select',
      options: [
        'Aluminium',
        'Carbon Fibre',
        'Ferrocement',
        'Fibreglass',
        'Kevlar',
        'Plastic',
        'Plywood',
        'Rubber',
        'Steel',
        'Timber',
        'Other/Composite'
      ],
      specifyValues: ['Other/Composite']
    },
    {
      id: 'hullLength',
      label: 'Hull Length',
      type: 'length'
    },
    {
      id: 'hullType',
      label: 'Hull Type',
      type: 'select',
      options: [
        'Cabin Cruiser',
        'Catamaran POWER',
        'Catamaran SAILING',
        'Centre Console',
        'Ex Cray Fishing Boat',
        'Flybridge Cruiser',
        'Half Cabin Cruiser',
        'Houseboat',
        'Jet Boat',
        'Monohull Motor Yacht',
        'Monohull Sailing Yacht',
        'Pontoon Boat',
        'Rigid Inflatable',
        'Runabout',
        'Sailing Dinghy / Skiff',
        'Ski Boat',
        'Sports Cruiser',
        'Trimaran',
        'Other'
      ],
      specifyValues: ['Other']
    },
    {
      id: 'mastConstruction',
      label: 'Mast Construction',
      type: 'select',
      options: [
        'Aluminium',
        'Carbon Fibre',
        'Fibreglass',
        'Timber',
        'Other'
      ],
      specifyValues: ['Other']
    },
    {
      id: 'numberOfMotors',
      label: 'Number of Motors',
      type: 'select',
      options: [
        '0',
        '1',
        '2',
        '3',
        '4',
        '5+'
      ]
    },
    {
      id: 'motorMake',
      label: 'Motor Make',
      type: 'select',
      options: [
        'NO MOTOR',
        'Beta',
        'BMW',
        'Caterpillar',
        'Cummins',
        'Evinrude',
        'Honda',
        'Johnson',
        'MAN',
        'Mariner',
        'MerCruiser',
        'Mercury',
        'Suzuki',
        'Tohatsu',
        'Volvo Penta',
        'Yamaha',
        'Yanmar',
        'Other'
      ],
      specifyValues: ['Other']
    },
    {
      id: 'motorType',
      label: 'Motor Type',
      type: 'select',
      options: [
        'NO MOTOR',
        'Outboard Electric',
        'Outboard Petrol',
        'Sterndrive Petrol',
        'Inboard Petrol',
        'Jet Drive Petrol',
        'Sterndrive Diesel',
        'Inboard Diesel',
        'Jet Drive Diesel',
        'Other'
      ],
      specifyValues: ['Other']
    },
    {
    id: 'equipmentOver2000',
    label:
        'Do you have equipment valued at $2,000 or above to insure with the vessel?',
    type: 'select',
    options: ['No', 'Yes'],
    infoText:
        'Automatic coverage: $2,000 on any one item with a limit of $20,000 in total.'
    },
    {
      id: 'purchaseDate',
      label: 'Purchase Date',
      type: 'date'
    },
    {
      id: 'purchasePrice',
      label: 'Purchase Price',
      type: 'currency',
      placeholder: '$'
    },
    {
    id: 'totalSumInsured',
    label: 'Total Sum Insured',
    type: 'currency',
    placeholder: '$',
    infoText:
        'The amount We insure Your Vessel for and is the total of the Market value for all of the Vessel’s Hull, Motors and/or Machinery, Equipment and Accessories, Sails, Masts, Spars, Standing and Running Rigging and Trailer.'
    },
    {
    id: 'storageMethod',
    label: 'Storage Method',
    type: 'select',
    options: [
        'Trailer - Garage / Shed',
        'Trailer - Behind Locked Gates',
        'Trailer - Carport / Driveway / Front Lawn',
        'Trailer - Roadside / Verge / Other',
        'Hardstand / Rack',
        'Private Jetty - Floating Dock',
        'Private Jetty - In Water',
        'Marina berth / Private jetty',
        'Fore & Aft / Pile Mooring',
        'Swing Mooring',
        'Other'
    ],
    specifyValues: ['Other']
    },
    {
    id: 'locationDetails',
    label: 'Location Address',
    type: 'location'
    },
    {
    id: 'layUpMonths',
    label: 'Lay-Up Period',
    type: 'number',
    placeholder: '0 to 4 months',
    infoText:
        'During this lay-up period Your Vessel must at all times be stored within the boundary of Your property behind locked gates, walls, or fences at Your nominated address and must not be used.<br><br>During the lay-up period We will limit the cover on Your Vessel to loss or Damage caused by fire and Theft only.<br><br>If, at any stage, You wish to amend this cover please contact Us so We may arrange this. The Premium charged is reflective of this lay-up period however adjustments to Your Premium may be required to reflect any amendments to this cover.'
    },
    {
    id: 'liabilityLimit',
    label: 'Liability Limit',
    type: 'select',
    options: [
        '$10,000,000',
        '$20,000,000'
    ]
    },
    {
    id: 'waterSkiing',
    label:
        'Do you require cover for water skiing and/or aquaplaning liability?',
    type: 'select',
    options: ['No', 'Yes'],
    infoText:
        'If We have agreed to cover You and it is shown in Your Policy Schedule and You have paid any additional Premium We ask for, We will cover:<br><br>• You, or<br>• any person allowed by You to control Your Vessel, and<br>• the person acting as an observer (within the requirements of any law)<br><br>against legal liability for:<br><br>• Accidental death or bodily injury to a water skier or aquaplaner (including You) towed by Your Vessel,<br>• Accidental death or bodily injury to any person caused by a water skier or aquaplaner being towed by Your Vessel, or<br>• Accidental Damage to Third Party property caused by a water skier or aquaplaner being towed by Your Vessel.<br><br>We will also cover a water skier or aquaplaner towed by Your Vessel against that water skier’s or aquaplaner’s legal liability for:<br><br>• Accidental death or bodily injury to a person, or<br>• Accidental Damage to property other than Your Vessel<br><br>caused by the water skier or aquaplaner while being towed by Your Vessel.'
    },
    {
    id: 'yachtRacing',
    label:
        'Do you require cover for official and/or organised yacht racing?',
    type: 'select',
    options: [
        'No',
        'Yes, Racing up to 25 Nautical Miles excluding spinnaker use',
        'Yes, Racing up to 50 Nautical Miles including spinnaker use',
        'Yes, Racing over 50 Nautical Miles'
    ],
    infoText:
        'If We have agreed to cover You for yacht racing risks and it is shown in Your Policy Schedule, We will provide additional cover to You for loss of or Damage to Your Vessel, including its’ Sails, Masts, Spars, Standing and Running Rigging, while Your Vessel is being raced in yacht club or association organised races:<br><br>• not exceeding the overall distance of the yacht race noted in the Yacht Racing Endorsement shown in Your Policy Schedule, and<br>• within the geographical limits shown in Your Policy Schedule.'
    },
    ];

  const SAILING_HULL_TYPES = [
    'Catamaran SAILING',
    'Monohull Sailing Yacht',
    'Sailing Dinghy / Skiff',
    'Other'
  ];

  const SAILING_ONLY_FIELDS = [
    'mastConstruction',
    'yachtRacing'
  ];

  function isSailingVessel() {
    return SAILING_HULL_TYPES.includes(
      quoteState.vesselDetails.hullType
    );
  }

  function createSelectOptions(options) {
    return `
      <option value="" disabled selected>Select</option>
      ${options.map(option => `
        <option value="${option}">
          ${option}
        </option>
      `).join('')}
    `;
  }

  function renderVesselFields() {
    const list =
      document.getElementById('vesselFieldList');

    list.innerHTML = vesselFields.map(field => {
      let inputHtml = '';

      if (field.type === 'location') {
        inputHtml = addressHtml(
          'locationAddress',
          quoteState.vesselDetails
        );
      } else if (field.type === 'select') {
        inputHtml = `
          <select
            id="${field.id}"
            data-vessel-field="${field.id}"
          >
            ${createSelectOptions(field.options)}
          </select>
        `;
      } else if (field.type === 'length') {
        inputHtml = `
          <div class="length-input-group">
            <input
              type="number"
              id="hullLength"
              data-vessel-field="hullLength"
              min="0"
              step="0.01"
              inputmode="decimal"
              placeholder="0"
            >

            <select
              id="hullLengthUnit"
              data-vessel-field="hullLengthUnit"
              class="length-unit"
            >
              <option value="m" selected>m</option>
              <option value="ft">ft</option>
            </select>
          </div>
        `;
      } else {
        const inputType =
          field.type === 'currency'
            ? 'text'
            : field.type;

        inputHtml = `
          <input
            type="${inputType}"
            id="${field.id}"
            data-vessel-field="${field.id}"
            ${field.type === 'currency'
              ? 'data-currency="true" inputmode="numeric"'
              : ''}
            ${field.id === 'hullYearBuilt'
              ? 'min="1900" max="9999" step="1"'
              : ''}
            ${field.id === 'layUpMonths'
              ? 'min="0" max="4" step="1"'
              : ''}
            placeholder="${field.placeholder || ''}"
          >
        `;
      }

      const specifyHtml =
        field.specifyValues
          ? `
            <div
              class="conditional-field"
              id="${field.id}SpecifyWrap"
              style="display:none;"
            >
              <input
                type="text"
                id="${field.id}Specify"
                data-vessel-field="${field.id}Specify"
                placeholder="Please Specify"
              >
            </div>
          `
          : '';

      const equipmentHtml =
        field.id === 'equipmentOver2000'
            ? `
            <div
                class="conditional-field equipment-details"
                id="equipmentDetails"
                style="display:none;"
            >
                <input
                type="text"
                id="equipmentDescription"
                data-vessel-field="equipmentDescription"
                placeholder="Item Description"
                >

                <input
                type="text"
                id="equipmentValue"
                data-vessel-field="equipmentValue"
                data-currency="true"
                inputmode="numeric"
                placeholder="Value ($)"
                >
            </div>
            `
            : '';

      return `
        <div
          class="field-row"
          id="${field.id}Row"
          data-field-row="${field.id}"
          ${SAILING_ONLY_FIELDS.includes(field.id) && !isSailingVessel()
            ? 'style="display:none;"'
            : ''}
        >
          <p class="field-label">
            <span>${field.label}</span>

            ${field.infoText ? `
                <span class="info-tooltip">
                <span
                    class="info-tooltip-icon"
                    tabindex="0"
                    aria-label="More information"
                >
                    i
                </span>

                <span class="info-tooltip-box">
                    ${field.infoText}
                </span>
                </span>
            ` : ''}
            </p>

          <div class="field-input-wrap">
            ${inputHtml}
            ${specifyHtml}
            ${equipmentHtml}
          </div>
        </div>
      `;
    }).join('');

    quoteState.vesselDetails.hullLengthUnit = 'm';

    list
      .querySelectorAll('input, select, textarea')
      .forEach(element => {
        const saveValue = () => {
          const fieldName =
            element.dataset.vesselField;

          if (!fieldName) return;

          if (element.dataset.currency === 'true') {
            formatCurrencyInput(element);
          }

          if (fieldName === 'layUpMonths') {
            const numberValue =
              Number(element.value);

            if (
              element.value !== '' &&
              numberValue > 4
            ) {
              element.value = '4';
            }

            if (
              element.value !== '' &&
              numberValue < 0
            ) {
              element.value = '0';
            }
          }

          quoteState.vesselDetails[fieldName] =
            element.value;

          updateConditionalVesselFields(
            fieldName,
            element.value
          );

          checkStep3Complete();
        };

        element.addEventListener('input', saveValue);
        element.addEventListener('change', saveValue);
      });

    bindAddress(
      list,
      quoteState.vesselDetails,
      'locationAddress',
      checkStep3Complete
    );
}

  function formatCurrencyInput(input) {
    const digits =
      input.value.replace(/\D/g, '');

    input.value = digits
      ? '$' + Number(digits).toLocaleString('en-AU')
      : '';
  }

  function updateConditionalVesselFields(
    fieldName,
    value
  ) {
    const field =
      vesselFields.find(item => item.id === fieldName);

    if (field && field.specifyValues) {
      const showSpecify =
        field.specifyValues.includes(value);

      const specifyWrap =
        document.getElementById(
          `${fieldName}SpecifyWrap`
        );

      if (specifyWrap) {
        specifyWrap.style.display =
          showSpecify ? 'block' : 'none';

        if (!showSpecify) {
          const specifyInput =
            specifyWrap.querySelector('input');

          if (specifyInput) {
            specifyInput.value = '';
          }

          quoteState.vesselDetails[
            `${fieldName}Specify`
          ] = '';
        }
      }
    }

    if (fieldName === 'hullType') {
      const isSailing = isSailingVessel();

      SAILING_ONLY_FIELDS.forEach(id => {
        const row = document.getElementById(`${id}Row`);

        if (row) {
          row.style.display = isSailing ? '' : 'none';
        }

        if (!isSailing) {
          const select = document.getElementById(id);
          const specifyWrap =
            document.getElementById(`${id}SpecifyWrap`);

          if (select) select.value = '';

          if (specifyWrap) {
            specifyWrap.style.display = 'none';
            specifyWrap.querySelector('input').value = '';
          }

          delete quoteState.vesselDetails[id];
          delete quoteState.vesselDetails[`${id}Specify`];
        }
      });
    }

    if (fieldName === 'equipmentOver2000') {
      const equipmentDetails =
        document.getElementById(
          'equipmentDetails'
        );

      if (equipmentDetails) {
        equipmentDetails.style.display =
            value === 'Yes'
                ? 'flex'
                : 'none';
      }

      if (value !== 'Yes') {
        const equipmentDescription =
            document.getElementById(
            'equipmentDescription'
            );

        const equipmentValue =
            document.getElementById(
            'equipmentValue'
            );

        if (equipmentDescription) {
            equipmentDescription.value = '';
        }

        if (equipmentValue) {
            equipmentValue.value = '';
        }

        quoteState.vesselDetails.equipmentDescription = '';
        quoteState.vesselDetails.equipmentValue = '';
        }
    }

    if (
      fieldName === 'numberOfMotors' &&
      value === '0'
    ) {
      const motorMake =
        document.getElementById('motorMake');

      const motorType =
        document.getElementById('motorType');

      motorMake.value = 'NO MOTOR';
      motorType.value = 'NO MOTOR';

      quoteState.vesselDetails.motorMake =
        'NO MOTOR';

      quoteState.vesselDetails.motorType =
        'NO MOTOR';
    }
  }

  function checkStep3Complete() {
    if (DEV_BYPASS_VALIDATION) {
      continueStep3Btn.disabled = false;
      return;
    }

    const requiredFields = [
      'hullMake',
      'hullModel',
      'hullYearBuilt',
      'hullConstruction',
      'hullLength',
      'hullLengthUnit',
      'hullType',
      'mastConstruction',
      'numberOfMotors',
      'motorMake',
      'motorType',
      'equipmentOver2000',
      'purchaseDate',
      'purchasePrice',
      'totalSumInsured',
      'storageMethod',
      'locationAddress',
      'layUpMonths',
      'liabilityLimit',
      'waterSkiing',
      'yachtRacing'
    ];

    const baseFieldsComplete =
      requiredFields.every(fieldName => {
        if (
          SAILING_ONLY_FIELDS.includes(fieldName) &&
          !isSailingVessel()
        ) {
          return true;
        }

        const value =
          quoteState.vesselDetails[fieldName];

        return (
          value !== undefined &&
          String(value).trim() !== ''
        );
      });

    const specifyFieldsComplete =
      vesselFields.every(field => {
        if (!field.specifyValues) {
          return true;
        }

        const selectedValue =
          quoteState.vesselDetails[field.id];

        if (
          !field.specifyValues.includes(
            selectedValue
          )
        ) {
          return true;
        }

        const specifiedValue =
          quoteState.vesselDetails[
            `${field.id}Specify`
          ];

        return (
          specifiedValue &&
          specifiedValue.trim() !== ''
        );
      });

    const equipmentComplete =
        quoteState.vesselDetails
            .equipmentOver2000 !== 'Yes' ||
        (
            quoteState.vesselDetails.equipmentDescription &&
            quoteState.vesselDetails.equipmentDescription.trim() !== '' &&
            quoteState.vesselDetails.equipmentValue &&
            quoteState.vesselDetails.equipmentValue.trim() !== ''
        );

        continueStep3Btn.disabled = !(
        baseFieldsComplete &&
        specifyFieldsComplete &&
        equipmentComplete
        );
        }

// ==================================================
// PAGE 3: EXPERIENCE AND HISTORY
// ==================================================

const experienceFields = [
  {
    id: 'numOwners',
    label: 'How many people own this vessel?',
    options: ['1', '2', '3', '4', '5+']
  },
  {
    id: 'numSkippers',
    label: 'How many people skipper this vessel?',
    options: ['1', '2', '3', '4', '5+']
  }
];

const yearsOptions = [
  '0',
  '1',
  '2',
  '3',
  '4',
  '5+'
];

const past5YearsQuestions = [
  {
    id: 'cancelledRefused',
    text:
      'Had any insurances cancelled, refused or had special conditions imposed?',
    details: true
  },
  {
    id: 'madeClaims',
    text:
      'Made any boat insurance claims?',
    claims: true
  }
];

const everQuestions = [
  {
    id: 'chargedConvicted',
    text:
      'Been charged or convicted with any offence?',
    details: true
  },
  {
    id: 'lostLicence',
    text:
      'Lost your boat or motor vehicle licence?',
    details: true
  }
];

function renderExperienceFields() {
  const list =
    document.getElementById('experienceFieldList');

  list.innerHTML = experienceFields.map(field => `
    <div class="field-row">

      <p class="field-label">
        ${field.label}
        <span class="required">*</span>
      </p>

      <div class="field-input-wrap">

        <select
          data-experience-field="${field.id}"
        >
          ${createSelectOptions(field.options)}
        </select>

      </div>

    </div>
  `).join('');

  list
    .querySelectorAll('select')
    .forEach(select => {

      select.addEventListener('change', () => {

        quoteState.experienceHistory[
          select.dataset.experienceField
        ] = select.value;

        updateExperienceReferralState();
        checkStep4Complete();

      });

    });
}

// ==================================================
// SKIPPER DETAILS
// ==================================================

let skipperRowCount = 0;

function addSkipperRow() {
  skipperRowCount++;

  const rows =
    document.getElementById('skipperRows');

  const row =
    document.createElement('div');

  row.className = 'cpwc-skipper-row';

  row.innerHTML = `
    <input
      type="text"
      placeholder="Full Name"
      data-skipper-field="name"
    >

    <input
      type="date"
      data-skipper-field="dob"
    >

    <input
      type="date"
      data-skipper-field="licenceDate"
    >

    <select data-skipper-field="yearsOwning">
      ${createSelectOptions(yearsOptions)}
    </select>

    <select data-skipper-field="yearsThisSize">
      ${createSelectOptions(yearsOptions)}
    </select>

    <textarea
      rows="2"
      placeholder="Example: 6m Runabout, 2020-2024"
      data-skipper-field="previousBoats"
    ></textarea>

    ${
      skipperRowCount > 1
        ? `
          <button
            type="button"
            class="remove-row-btn"
            data-remove-skipper
          >
            ×
          </button>
        `
        : '<span></span>'
    }
  `;

  rows.appendChild(row);

    row
    .querySelectorAll('input, select, textarea')
    .forEach(element => {
      element.addEventListener(
        'input',
        updateSkippersState
      );

      element.addEventListener(
        'change',
        updateSkippersState
      );
    });

  const removeButton =
    row.querySelector('[data-remove-skipper]');

  if (removeButton) {
    removeButton.addEventListener('click', () => {
      row.remove();
      updateSkippersState();
    });
  }

  updateSkippersState();
}

function updateSkippersState() {
  const rows =
    document.querySelectorAll(
      '#skipperRows .cpwc-skipper-row'
    );

  quoteState.experienceHistory.skippers =
    Array.from(rows).map(row => {
      const getValue = fieldName =>
        row.querySelector(
          `[data-skipper-field="${fieldName}"]`
        ).value;

      return {
        name: getValue('name'),
        dob: getValue('dob'),
        licenceDate: getValue('licenceDate'),
        yearsOwning: getValue('yearsOwning'),
        yearsThisSize: getValue('yearsThisSize'),
        previousBoats: getValue('previousBoats')
      };
    });

  updateExperienceReferralState();
  checkStep4Complete();
}

function renderHistoryQuestions(
  containerId,
  questionsArray,
  stateKey
) {
  const list =
    document.getElementById(containerId);

  list.innerHTML = questionsArray.map(question => `
    <div
      class="experience-question-block"
      data-qid="${question.id}"
    >
      <div class="question-row">

        <p class="question-text">
          ${question.text}
        </p>

        <div class="question-toggle">
          <button
            type="button"
            class="toggle-btn"
            data-value="yes"
          >
            Yes
          </button>

          <button
            type="button"
            class="toggle-btn"
            data-value="no"
          >
            No
          </button>
        </div>

      </div>

      ${
        question.details
          ? `
            <div
              class="detail-row"
              style="display:none;"
            >
              <input
                type="text"
                placeholder="Please Specify"
              >
            </div>
          `
          : ''
      }
    </div>
  `).join('');

  list
    .querySelectorAll('.toggle-btn')
    .forEach(button => {
      button.addEventListener('click', () => {
        const block =
          button.closest(
            '.experience-question-block'
          );

        const questionId =
          block.dataset.qid;

        const value =
          button.dataset.value;

        block
          .querySelectorAll('.toggle-btn')
          .forEach(toggle => {
            toggle.classList.remove('selected');
          });

        button.classList.add('selected');

        quoteState.experienceHistory[
          stateKey
        ][questionId] = value;

        const detailRow =
          block.querySelector('.detail-row');

        if (detailRow) {
          detailRow.style.display =
            value === 'yes'
              ? 'block'
              : 'none';

          if (value !== 'yes') {
            detailRow
              .querySelector('input').value = '';

            quoteState.experienceHistory[
              stateKey
            ][`${questionId}Details`] = '';
          }
        }

        if (
          stateKey === 'past5Years' &&
          questionId === 'madeClaims'
        ) {
          toggleClaimsSection(value === 'yes');
        }

        updateExperienceReferralState();
        checkStep4Complete();
      });
    });

  list
    .querySelectorAll('.detail-row input')
    .forEach(input => {
      input.addEventListener('input', () => {
        const block =
          input.closest(
            '.experience-question-block'
          );

        quoteState.experienceHistory[
          stateKey
        ][`${block.dataset.qid}Details`] =
          input.value;

        checkStep4Complete();
      });
    });
}

let claimRowCount = 0;

function toggleClaimsSection(showClaims) {
  const claimsWrap =
    document.getElementById('claimsWrap');

  claimsWrap.style.display =
    showClaims ? 'block' : 'none';

  if (
    showClaims &&
    !document.querySelector(
      '#claimsRows .claims-row'
    )
  ) {
    addClaimRow();
  }

  if (!showClaims) {
    document.getElementById(
      'claimsRows'
    ).innerHTML = '';

    quoteState.experienceHistory.claims = [];
  }
}

function addClaimRow() {
  claimRowCount++;

  const row =
    document.createElement('div');

  row.className = 'claims-row';

  row.innerHTML = `
    <input
      type="date"
      data-claim-field="dateOfLoss"
    >

    <input
      type="text"
      placeholder="Description of Loss"
      data-claim-field="description"
    >

    <input
      type="text"
      data-currency="true"
      inputmode="numeric"
      placeholder="$0"
      data-claim-field="settlement"
    >

    ${
      claimRowCount > 1
        ? `
          <button
            type="button"
            class="remove-row-btn"
            data-remove-claim
          >
            ×
          </button>
        `
        : '<span></span>'
    }
  `;

  document
    .getElementById('claimsRows')
    .appendChild(row);

  row.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
      if (input.dataset.currency === 'true') {
        formatCurrencyInput(input);
      }

      updateClaimsState();
    });
  });

  const removeButton =
    row.querySelector('[data-remove-claim]');

  if (removeButton) {
    removeButton.addEventListener('click', () => {
      row.remove();
      updateClaimsState();
    });
  }

  updateClaimsState();
}

function updateClaimsState() {
  const rows =
    document.querySelectorAll(
      '#claimsRows .claims-row'
    );

  quoteState.experienceHistory.claims =
    Array.from(rows).map(row => ({
      dateOfLoss:
        row.querySelector(
          '[data-claim-field="dateOfLoss"]'
        ).value,

      description:
        row.querySelector(
          '[data-claim-field="description"]'
        ).value,

      settlement:
        row.querySelector(
          '[data-claim-field="settlement"]'
        ).value
    }));

  updateExperienceReferralState();
  checkStep4Complete();
}

function updateExperienceReferralState() {
  const history =
    quoteState.experienceHistory;

  const existingReasons =
    quoteState.referralReasons.filter(
      reason =>
        !reason.startsWith('Experience:')
    );

  const experienceReasons = [];

  if (['4', '5+'].includes(history.numOwners)) {
    experienceReasons.push(
      'Experience: four or more owners'
    );
  }

  if (['4', '5+'].includes(history.numSkippers)) {
    experienceReasons.push(
      'Experience: four or more skippers'
    );
  }

  if (
    history.skippers.some(
      skipper => skipper.yearsOwning === '0'
    )
  ) {
    experienceReasons.push(
      'Experience: no previous boat ownership'
    );
  }

  if (
    history.skippers.some(
      skipper => skipper.yearsThisSize === '0'
    )
  ) {
    experienceReasons.push(
      'Experience: no ownership of this size and type'
    );
  }

  if (
    history.past5Years.cancelledRefused === 'yes'
  ) {
    experienceReasons.push(
      'Experience: insurance cancelled or refused'
    );
  }

  if (
    history.past5Years.madeClaims === 'yes'
  ) {
    experienceReasons.push(
      'Experience: boat insurance claims'
    );
  }

  if (
    history.ever.chargedConvicted === 'yes'
  ) {
    experienceReasons.push(
      'Experience: offence history'
    );
  }

  if (
    history.ever.lostLicence === 'yes'
  ) {
    experienceReasons.push(
      'Experience: licence loss history'
    );
  }

  quoteState.referralReasons = [
    ...new Set([
      ...existingReasons,
      ...experienceReasons
    ])
  ];

  quoteState.referralRequired =
    quoteState.referralReasons.length > 0;
}

function checkStep4Complete() {
  const continueButton =
    document.getElementById('continueBtn4');

  if (DEV_BYPASS_VALIDATION) {
    continueButton.disabled = false;
    return;
  }

  const history =
    quoteState.experienceHistory;

  const topFieldsComplete =
    experienceFields.every(field =>
      history[field.id]
    );

  const skippersComplete =
    history.skippers.length > 0 &&
    history.skippers.every(skipper =>
      skipper.name &&
      skipper.dob &&
      skipper.licenceDate &&
      skipper.yearsOwning &&
      skipper.yearsThisSize
    );

  const pastQuestionsComplete =
    past5YearsQuestions.every(question =>
      history.past5Years[question.id]
    );

  const everQuestionsComplete =
    everQuestions.every(question =>
      history.ever[question.id]
    );



  const detailsComplete =
    [
      ['past5Years', past5YearsQuestions],
      ['ever', everQuestions]
    ].every(([group, questionList]) =>
      questionList
        .filter(question =>
          question.details &&
          history[group][question.id] === 'yes'
        )
        .every(question =>
          (history[group][`${question.id}Details`] || '').trim() !== ''
        )
    );

  const claimsComplete =
    history.past5Years.madeClaims !== 'yes' ||
    (
      history.claims.length > 0 &&
      history.claims.every(claim =>
        claim.dateOfLoss &&
        claim.description &&
        claim.settlement
      )
    );

    continueButton.disabled = !(
    topFieldsComplete &&
    skippersComplete &&
    pastQuestionsComplete &&
    everQuestionsComplete &&
    detailsComplete &&
    claimsComplete
    );
}

// ==================================================
// PAGE 4: ADDITIONAL BOATS
// ==================================================

let additionalBoatCount = 0;

const additionalBoatFields = [
  {
    id: 'hullMake',
    label: 'Hull Make',
    type: 'select',
    options: hullMakeOptions
  },
  {
    id: 'hullModel',
    label: 'Hull Model',
    type: 'text',
    placeholder: 'Enter hull model'
  },
  {
    id: 'hullYearBuilt',
    label: 'Hull Year Built',
    type: 'number',
    placeholder: 'YYYY'
  },
  {
    id: 'hullConstruction',
    label: 'Hull Construction',
    type: 'select',
    options: [
      'Aluminium',
      'Carbon Fibre',
      'Ferrocement',
      'Fibreglass',
      'Kevlar',
      'Plastic',
      'Plywood',
      'Rubber',
      'Steel',
      'Timber',
      'Other/Composite'
    ]
  },
  {
    id: 'hullLength',
    label: 'Hull Length',
    type: 'length'
  },
  {
    id: 'hullType',
    label: 'Hull Type',
    type: 'select',
    options: [
      'Cabin Cruiser',
      'Catamaran POWER',
      'Catamaran SAILING',
      'Centre Console',
      'Ex Cray Fishing Boat',
      'Flybridge Cruiser',
      'Half Cabin Cruiser',
      'Houseboat',
      'Jet Boat',
      'Monohull Motor Yacht',
      'Monohull Sailing Yacht',
      'Pontoon Boat',
      'Rigid Inflatable',
      'Runabout',
      'Sailing Dinghy / Skiff',
      'Ski Boat',
      'Sports Cruiser',
      'Trimaran',
      'Other'
    ]
  },
  {
    id: 'numberOfMotors',
    label: 'Number of Motors',
    type: 'select',
    options: [
      '0',
      '1',
      '2',
      '3',
      '4',
      '5+'
    ]
  },
  {
    id: 'motorMake',
    label: 'Motor Make',
    type: 'select',
    options: [
      'NO MOTOR',
      'Beta',
      'BMW',
      'Caterpillar',
      'Cummins',
      'Evinrude',
      'Honda',
      'Johnson',
      'MAN',
      'Mariner',
      'MerCruiser',
      'Mercury',
      'Suzuki',
      'Tohatsu',
      'Volvo Penta',
      'Yamaha',
      'Yanmar',
      'Other'
    ]
  },
  {
    id: 'motorType',
    label: 'Motor Type',
    type: 'select',
    options: [
      'NO MOTOR',
      'Outboard Electric',
      'Outboard Petrol',
      'Sterndrive Petrol',
      'Inboard Petrol',
      'Jet Drive Petrol',
      'Sterndrive Diesel',
      'Inboard Diesel',
      'Jet Drive Diesel',
      'Other'
    ]
  },
  {
    id: 'purchaseDate',
    label: 'Purchase Date',
    type: 'date'
  },
  {
    id: 'purchasePrice',
    label: 'Purchase Price',
    type: 'currency',
    placeholder: '$'
  },
  {
    id: 'totalSumInsured',
    label: 'Total Sum Insured',
    type: 'currency',
    placeholder: '$'
  },
  {
    id: 'storageMethod',
    label: 'Storage Method',
    type: 'select',
    options: [
      'Trailer - Garage / Shed',
      'Trailer - Behind Locked Gates',
      'Trailer - Carport / Driveway / Front Lawn',
      'Trailer - Roadside / Verge / Other',
      'Hardstand / Rack',
      'Private Jetty - Floating Dock',
      'Private Jetty - In Water',
      'Marina berth / Private jetty',
      'Fore & Aft / Pile Mooring',
      'Swing Mooring',
      'Other'
    ]
  },
  {
    id: 'locationAddress',
    label: 'Location Address',
    type: 'text',
    placeholder: 'Enter storage address'
  }
];


function createAdditionalBoatInput(field) {

  // LOCATION ADDRESS
  if (field.id === 'locationAddress') {
    return `
      <div class="address-field" data-additional-address>

        <div class="address-lookup-wrap">
          <input
            type="text"
            data-additional-address-lookup
            autocomplete="off"
            placeholder="Start typing address..."
          >
        </div>

        <div
          class="address-manual"
          data-additional-address-manual
          style="display:none;"
        >
          <input
            type="text"
            data-additional-address-part="street"
            placeholder="Street address"
          >

          <input
            type="text"
            data-additional-address-part="suburb"
            placeholder="Suburb"
          >

          <select data-additional-address-part="state">
            <option value="" disabled selected>
              State
            </option>

            ${STATES.map(state => `
              <option value="${state}">
                ${state}
              </option>
            `).join('')}
          </select>

          <input
            type="text"
            data-additional-address-part="postcode"
            inputmode="numeric"
            maxlength="4"
            placeholder="Postcode"
          >
        </div>

        <button
          type="button"
          class="link-btn"
          data-additional-address-toggle
        >
          Enter address manually
        </button>

      </div>
    `;
  }

  // SELECT
  if (field.type === 'select') {
    return `
      <select
        data-additional-boat-field="${field.id}"
      >
        ${createSelectOptions(field.options)}
      </select>
    `;
  }

  // LENGTH
  if (field.type === 'length') {
    return `
      <div class="length-input-group">

        <input
          type="number"
          min="0"
          step="0.01"
          inputmode="decimal"
          placeholder="0"
          data-additional-boat-field="hullLength"
        >

        <select
          class="length-unit"
          data-additional-boat-field="hullLengthUnit"
        >
          <option value="m" selected>
            m
          </option>

          <option value="ft">
            ft
          </option>
        </select>

      </div>
    `;
  }

  // STANDARD / CURRENCY INPUT
  const inputType =
    field.type === 'currency'
      ? 'text'
      : field.type;

  return `
    <input
      type="${inputType}"
      placeholder="${field.placeholder || ''}"
      data-additional-boat-field="${field.id}"

      ${
        field.type === 'currency'
          ? 'data-currency="true" inputmode="numeric"'
          : ''
      }

      ${
        field.id === 'hullYearBuilt'
          ? 'min="1900" max="9999" step="1"'
          : ''
      }
    >
  `;
}


function addAdditionalBoat() {
  additionalBoatCount++;

  const boatNumber =
    additionalBoatCount;

  const card =
    document.createElement('div');

  card.className =
    'additional-boat-card';

  card.dataset.boatNumber =
    boatNumber;

  card.innerHTML = `
    <div class="additional-boat-header">

      <h4>
        Additional Boat ${boatNumber}
      </h4>

      <button
        type="button"
        class="remove-additional-boat-btn"
        aria-label="Remove additional boat"
      >
        ×
      </button>

    </div>

    <div class="additional-boat-fields">

      ${additionalBoatFields.map(field => `
        <div class="field-row">

          <p class="field-label">
            ${field.label}
          </p>

          <div class="field-input-wrap">
            ${createAdditionalBoatInput(field)}
          </div>

        </div>
      `).join('')}

    </div>

    <div class="additional-skipper-question">

      <span class="additional-skipper-question-text">
        Will this boat have a different skipper?
        <span class="required">*</span>
      </span>

      <div class="question-toggle">

        <button
          type="button"
          class="toggle-btn"
          data-different-boat-skipper="yes"
        >
          Yes
        </button>

        <button
          type="button"
          class="toggle-btn"
          data-different-boat-skipper="no"
        >
          No
        </button>

      </div>

    </div>

    <div
      class="additional-boat-skipper-section"
      data-additional-boat-skipper-section
      style="display:none;"
    >

      <p class="subsection-label">
        Skipper Details
      </p>

      <div class="skipper-table">

        <div class="cpwc-skipper-header-row">

          <span>Skipper name</span>

          <span>Date of birth</span>

          <span>
            Date boat licence obtained
          </span>

          <span>
            Years owning a boat
          </span>

          <span>
            Years owning a boat of this size and type
          </span>

          <span>
            Previous boats owned, including length,
            type and ownership period
          </span>

          <span></span>

        </div>

        <div
          class="additional-boat-skipper-rows"
          data-additional-boat-skipper-rows
        ></div>

        <button
          type="button"
          class="add-row-btn"
          data-add-additional-boat-skipper
        >
          +
        </button>

      </div>

    </div>
  `;

  document
    .getElementById('additionalBoatsList')
    .appendChild(card);

  card
    .querySelectorAll(
      'input, select, textarea'
    )
    .forEach(element => {

      element.addEventListener(
        'input',
        () => {
          if (
            element.dataset.currency ===
            'true'
          ) {
            formatCurrencyInput(element);
          }

          if (
            element.dataset
              .additionalBoatField ===
              'numberOfMotors' &&
            element.value === '0'
          ) {
            const motorMake =
              card.querySelector(
                '[data-additional-boat-field="motorMake"]'
              );

            const motorType =
              card.querySelector(
                '[data-additional-boat-field="motorType"]'
              );

            if (motorMake) {
              motorMake.value = 'NO MOTOR';
            }

            if (motorType) {
              motorType.value = 'NO MOTOR';
            }
          }

          updateAdditionalBoatsState();
        }
      );

      element.addEventListener(
        'change',
        () => {
          if (
            element.dataset
              .additionalBoatField ===
              'numberOfMotors' &&
            element.value === '0'
          ) {
            const motorMake =
              card.querySelector(
                '[data-additional-boat-field="motorMake"]'
              );

            const motorType =
              card.querySelector(
                '[data-additional-boat-field="motorType"]'
              );

            if (motorMake) {
              motorMake.value = 'NO MOTOR';
            }

            if (motorType) {
              motorType.value = 'NO MOTOR';
            }
          }

          updateAdditionalBoatsState();
        }
      );

    });

  card
    .querySelectorAll(
      '[data-different-boat-skipper]'
    )
    .forEach(button => {
      button.addEventListener('click', () => {

        card
          .querySelectorAll(
            '[data-different-boat-skipper]'
          )
          .forEach(toggle => {
            toggle.classList.remove('selected');
          });

        button.classList.add('selected');

        const value =
          button.dataset.differentBoatSkipper;

        card.dataset.differentSkipper =
          value;

        const skipperSection =
          card.querySelector(
            '[data-additional-boat-skipper-section]'
          );

        const skipperRows =
          card.querySelector(
            '[data-additional-boat-skipper-rows]'
          );

        if (value === 'yes') {
          skipperSection.style.display =
            'block';

          if (
            skipperRows.children.length === 0
          ) {
            addAdditionalBoatSkipperRow(card);
          }
        } else {
          skipperSection.style.display =
            'none';

          skipperRows.innerHTML = '';
        }

        updateAdditionalBoatsState();
      });
    });

  card
    .querySelector(
      '[data-add-additional-boat-skipper]'
    )
    .addEventListener('click', () => {
      addAdditionalBoatSkipperRow(card);
    });

  card
    .querySelector(
      '.remove-additional-boat-btn'
    )
    .addEventListener('click', () => {
      card.remove();

      renumberAdditionalBoats();
      updateAdditionalBoatsState();
    });

  updateAdditionalBoatsState();
}

function addAdditionalBoatSkipperRow(card) {
  const rowsContainer =
    card.querySelector(
      '[data-additional-boat-skipper-rows]'
    );

  const existingRows =
    rowsContainer.querySelectorAll(
      '.additional-boat-skipper-row'
    );

  const row =
    document.createElement('div');

  row.className =
    'cpwc-skipper-row additional-boat-skipper-row';

  row.innerHTML = `
    <input
      type="text"
      placeholder="Full Name"
      data-additional-skipper-field="name"
    >

    <input
      type="date"
      data-additional-skipper-field="dob"
    >

    <input
      type="date"
      data-additional-skipper-field="licenceDate"
    >

    <select
      data-additional-skipper-field="yearsOwning"
    >
      ${createSelectOptions(yearsOptions)}
    </select>

    <select
      data-additional-skipper-field="yearsThisSize"
    >
      ${createSelectOptions(yearsOptions)}
    </select>

    <textarea
      rows="2"
      placeholder="Example: 6m Runabout, 2020-2024"
      data-additional-skipper-field="previousBoats"
    ></textarea>

    ${
      existingRows.length > 0
        ? `
          <button
            type="button"
            class="remove-row-btn"
            data-remove-additional-skipper
          >
            ×
          </button>
        `
        : '<span></span>'
    }
  `;

  rowsContainer.appendChild(row);

  row
    .querySelectorAll(
      'input, select, textarea'
    )
    .forEach(element => {
      element.addEventListener(
        'input',
        updateAdditionalBoatsState
      );

      element.addEventListener(
        'change',
        updateAdditionalBoatsState
      );
    });

  const removeButton =
    row.querySelector(
      '[data-remove-additional-skipper]'
    );

  if (removeButton) {
    removeButton.addEventListener(
      'click',
      () => {
        row.remove();
        updateAdditionalBoatsState();
      }
    );
  }

  updateAdditionalBoatsState();
}

function renumberAdditionalBoats() {
  const cards =
    document.querySelectorAll(
      '#additionalBoatsList .additional-boat-card'
    );

  cards.forEach((card, index) => {
    card.dataset.boatNumber =
      index + 1;

    card
      .querySelector('h4')
      .textContent =
        `Additional Boat ${index + 1}`;
  });

  additionalBoatCount =
    cards.length;
}

function updateAdditionalBoatsState() {
  const cards =
    document.querySelectorAll(
      '#additionalBoatsList .additional-boat-card'
    );

  quoteState.additionalBoats =
    Array.from(cards).map(card => {
      const boat = {
        hasDifferentSkipper:
          card.dataset.differentSkipper || '',

        locationAddress:
          card.dataset.locationAddress || '',

        locationAddressPostcode:
          card.dataset.locationAddressPostcode || '',

        skippers: []
      };

      card
        .querySelectorAll(
          '[data-additional-boat-field]'
        )
        .forEach(element => {
          boat[
            element.dataset
              .additionalBoatField
          ] = element.value;
        });

      const skipperRows =
        card.querySelectorAll(
          '.additional-boat-skipper-row'
        );

      boat.skippers =
        Array.from(skipperRows).map(row => ({
          name:
            row.querySelector(
              '[data-additional-skipper-field="name"]'
            ).value,

          dob:
            row.querySelector(
              '[data-additional-skipper-field="dob"]'
            ).value,

          licenceDate:
            row.querySelector(
              '[data-additional-skipper-field="licenceDate"]'
            ).value,

          yearsOwning:
            row.querySelector(
              '[data-additional-skipper-field="yearsOwning"]'
            ).value,

          yearsThisSize:
            row.querySelector(
              '[data-additional-skipper-field="yearsThisSize"]'
            ).value,

          previousBoats:
            row.querySelector(
              '[data-additional-skipper-field="previousBoats"]'
            ).value
        }));

      return boat;
    });

  checkAdditionalBoatsComplete();
}

function checkAdditionalBoatsComplete() {
  const continueButton =
    document.getElementById(
      'continueAdditionalBoatsBtn'
    );

  if (
    quoteState.hasAdditionalBoats === 'no'
  ) {
    continueButton.disabled = false;
    return;
  }

  if (
    quoteState.hasAdditionalBoats !== 'yes'
  ) {
    continueButton.disabled = true;
    return;
  }

  if (DEV_BYPASS_VALIDATION) {
    continueButton.disabled = false;
    return;
  }

  const requiredFields = [
    'hullMake',
    'hullModel',
    'hullYearBuilt',
    'hullConstruction',
    'hullLength',
    'hullLengthUnit',
    'hullType',
    'numberOfMotors',
    'motorMake',
    'motorType',
    'purchaseDate',
    'purchasePrice',
    'totalSumInsured',
    'storageMethod',
    'locationAddress'
  ];

    const boatsComplete =
    quoteState.additionalBoats.length > 0 &&
    quoteState.additionalBoats.every(boat => {

        const vesselComplete =
        requiredFields.every(
            fieldName =>
            boat[fieldName] !== undefined &&
            String(
                boat[fieldName]
            ).trim() !== ''
        );

        const skipperChoiceComplete =
        boat.hasDifferentSkipper === 'yes' ||
        boat.hasDifferentSkipper === 'no';

        const skipperDetailsComplete =
        boat.hasDifferentSkipper !== 'yes' ||
        (
            boat.skippers.length > 0 &&
            boat.skippers.every(skipper =>
            skipper.name &&
            skipper.dob &&
            skipper.licenceDate &&
            skipper.yearsOwning &&
            skipper.yearsThisSize
            )
        );

        return (
        vesselComplete &&
        skipperChoiceComplete &&
        skipperDetailsComplete
        );
    });

  continueButton.disabled =
    !boatsComplete;
}

function showAdditionalBoats() {
  showQuoteStep(5);
}

// ==================================================
// PAGE 5: YOUR QUOTE
// ==================================================

function formatQuoteCurrency(value) {
  const amount =
    Number(String(value || '').replace(/[^\d.]/g, ''));

  return amount
    ? amount.toLocaleString('en-AU', {
        style: 'currency',
        currency: 'AUD',
        maximumFractionDigits: 0
      })
    : '$0';
}

function setQuoteValue(elementId, value) {
  const element =
    document.getElementById(elementId);

  if (element) {
    element.textContent = value;
  }
}

function populateQuoteCover() {
  const details =
    quoteState.vesselDetails;

  setQuoteValue(
    'quoteTotalSumInsured',
    formatQuoteCurrency(
      details.totalSumInsured
    )
  );

  setQuoteValue(
    'quoteLiabilityLimit',
    details.liabilityLimit ||
      '$10,000,000'
  );

  const layUpMonths =
    Number(details.layUpMonths || 0);

  setQuoteValue(
    'quoteLayUpCover',
    layUpMonths > 0
      ? `${layUpMonths} month${
          layUpMonths === 1 ? '' : 's'
        }`
      : 'Not Applicable'
  );

  setQuoteValue(
    'quoteWaterSkiing',
    details.waterSkiing === 'Yes'
      ? 'Insured'
      : 'Not Insured'
  );

  setQuoteValue(
    'quoteYachtRacing',
    details.yachtRacing || 'No'
  );
}

function populateVesselSummary() {
  const list =
    document.getElementById(
      'vesselSummaryList'
    );

  if (!list) {
    return;
  }

  const vessels = [
    quoteState.vesselDetails,
    ...quoteState.additionalBoats
  ];

  list.innerHTML = vessels.map(
    (vessel, index) => {
      const hullMake =
        vessel.hullMake === 'Other'
          ? vessel.hullMakeSpecify
          : vessel.hullMake;

      const location = [
        vessel.locationAddress,
        vessel.location
      ]
        .filter(Boolean)
        .join(', ');

      return `
        <div class="details-row">

          <span class="details-label">
            Vessel ${index + 1}
          </span>

          <span class="details-value">

            <span>
              <strong>Hull Year Built:</strong>
              ${vessel.hullYearBuilt || 'Not provided'}
            </span>

            <span>
              <strong>Hull Make:</strong>
              ${hullMake || 'Not provided'}
            </span>

            <span>
              <strong>Hull Model:</strong>
              ${vessel.hullModel || 'Not provided'}
            </span>

            <span>
              <strong>Location Address:</strong>
              ${location || 'Not provided'}
            </span>

            <span>
              <strong>Total Sum Insured:</strong>
              ${formatQuoteCurrency(
                vessel.totalSumInsured
              )}
            </span>

            <span>
              <strong>Base Premium:</strong>
              $1,252.35
            </span>

            <span>
              <strong>GST:</strong>
              $125.24
            </span>

            <span>
              <strong>Stamp Duty:</strong>
              $137.76
            </span>

          </span>
        </div>
      `;
    }
  ).join('');
}

function getAllQuoteSkippers() {
  const primarySkippers =
    quoteState.experienceHistory.skippers || [];

  const additionalSkippers =
    quoteState.additionalBoats.flatMap(
      boat =>
        boat.hasDifferentSkipper === 'yes'
          ? boat.skippers
          : []
    );

  return [
    ...primarySkippers,
    ...additionalSkippers
  ];
}

function populateSkipperSummary() {
  const list =
    document.getElementById(
      'skipperSummaryList'
    );

  if (!list) {
    return;
  }

  const skippers =
    getAllQuoteSkippers();

  list.innerHTML = skippers.map(
    (skipper, index) => `
      <div class="details-row">

        <span class="details-label">
          Skipper ${index + 1}
        </span>

        <span class="details-value">

          <span>
            <strong>Name:</strong>
            ${skipper.name || 'Not provided'}
          </span>

          <span>
            <strong>DOB:</strong>
            ${formatQuoteDate(skipper.dob)}
          </span>

        </span>
      </div>
    `
  ).join('');
}

function setDefaultPolicyDates() {
  const startInput =
    document.getElementById(
      'policyStartDate'
    );

  const endInput =
    document.getElementById(
      'policyEndDate'
    );

  if (!startInput || !endInput) {
    return;
  }

  const today =
    new Date();

  const latestStart =
    new Date(today);

  latestStart.setDate(
    latestStart.getDate() + 30
  );

  const endDate =
    new Date(today);

  endDate.setFullYear(
    endDate.getFullYear() + 1
  );

  const toInputDate = date => {
    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1
      ).padStart(2, '0');

    const day =
      String(
        date.getDate()
      ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  startInput.min =
    toInputDate(today);

  startInput.max =
    toInputDate(latestStart);

  startInput.value =
    toInputDate(today);

  endInput.value =
    toInputDate(endDate);

  endInput.min =
    startInput.value;

  endInput.max =
    toInputDate(endDate);
}

function updatePolicyEndDate() {
  const startInput =
    document.getElementById(
      'policyStartDate'
    );

  const endInput =
    document.getElementById(
      'policyEndDate'
    );

  if (!startInput.value) {
    return;
  }

  const selectedStart =
    new Date(
      `${startInput.value}T00:00:00`
    );

  const maximumEnd =
    new Date(selectedStart);

  maximumEnd.setFullYear(
    maximumEnd.getFullYear() + 1
  );

  const toInputDate = date =>
    date.toISOString().split('T')[0];

  endInput.min =
    startInput.value;

  endInput.max =
    toInputDate(maximumEnd);

  endInput.value =
    toInputDate(maximumEnd);
}

function populateQuotePage() {
  populateQuoteCover();
  populateVesselSummary();
  populateSkipperSummary();
  setDefaultPolicyDates();
}

function showYourQuote() {
  populateQuotePage();
  showQuoteStep(6);
}

// ==================================================
// PAGES 6-7: YOUR DETAILS AND PAYMENT (see quote-checkout.js)
// ==================================================

const checkout = setupCheckout({
  quoteState,
  bypassValidation: DEV_BYPASS_VALIDATION,
  policyName: 'Comprehensive Pleasure Craft',
  paymentBaseAmount: 1570.34,
  getPolicyVessels: () => [quoteState.vesselDetails, ...quoteState.additionalBoats],
  getQuoteNumber: () =>
    document.querySelector('.your-quote-number')?.textContent?.replace('Quote Number:', '').trim() ||
    'Not provided'
});

const progressPageMap = {
  1: showImportantInformation,
  2: showVesselDetails,
  3: showExperienceHistory,
  4: showAdditionalBoats,
  5: showYourQuote,
  6: checkout.showYourDetails,
  7: checkout.showPaymentPage
};

enableProgressBarNavigation(DEV_BYPASS_VALIDATION, step => progressPageMap[step]());

function showIntro() {
  showQuoteStep(1);
}

function showImportantInformation() {
  showQuoteStep(2);
}

function showVesselDetails() {
  showQuoteStep(3);
}

function showExperienceHistory() {
  showQuoteStep(4);
}

function openDeclineModal() {
  progressBar.classList.add('declined');

  declineModal.classList.add('active');

  declineModal.setAttribute(
    'aria-hidden',
    'false'
  );

  document.body.classList.add('modal-open');
}

function exitDeclinedQuote() {
  window.location.href = 'products.html';
}

dutyAgreement.addEventListener('change', () => {
  getStartedBtn.disabled =
    !dutyAgreement.checked;
});

getStartedBtn.addEventListener('click', () => {
  showImportantInformation();
});

document
  .getElementById('backBtn2')
  .addEventListener(
    'click',
    showIntro
  );

continueStep2Btn.addEventListener('click', () => {
  if (hasDeclineResponse()) {
    openDeclineModal();
    return;
  }

  updateReferralState();
  showVesselDetails();
});

document
  .getElementById('backBtn3')
  .addEventListener(
    'click',
    showImportantInformation
  );

continueStep3Btn.addEventListener(
  'click',
  showExperienceHistory
);

document
  .getElementById('backBtn4')
  .addEventListener(
    'click',
    showVesselDetails
  );

document
  .getElementById('continueBtn4')
  .addEventListener(
    'click',
    showAdditionalBoats
  );

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
          toggle.classList.remove(
            'selected'
          );
        });

      button.classList.add('selected');

      const value =
        button.dataset.value;

      quoteState.hasAdditionalBoats =
        value;

      const addButton =
        document.getElementById(
          'addBoatRowBtn'
        );

      if (value === 'yes') {
        addButton.style.display =
          'inline-flex';

        if (
          quoteState.additionalBoats
            .length === 0
        ) {
          addAdditionalBoat();
        }
      } else {
        addButton.style.display =
          'none';

        document.getElementById(
          'additionalBoatsList'
        ).innerHTML = '';

        quoteState.additionalBoats = [];
        additionalBoatCount = 0;
      }

      checkAdditionalBoatsComplete();
    });
  });

document
  .getElementById('addBoatRowBtn')
  .addEventListener(
    'click',
    addAdditionalBoat
  );

document
  .getElementById(
    'backAdditionalBoatsBtn'
  )
  .addEventListener(
    'click',
    showExperienceHistory
  );

document
  .getElementById(
    'continueAdditionalBoatsBtn'
  )
  .addEventListener(
    'click',
    showYourQuote
  );


document
  .getElementById('backBtn5')
  .addEventListener(
    'click',
    showAdditionalBoats
  );

document
  .getElementById('addBoatBtn')
  .addEventListener(
    'click',
    showAdditionalBoats
  );

document
  .getElementById('policyStartDate')
  .addEventListener(
    'change',
    updatePolicyEndDate
  );

const emailQuoteModal =
  document.getElementById(
    'emailQuoteModal'
  );

const closeEmailQuoteModal =
  document.getElementById(
    'closeEmailQuoteModal'
  );

function openQuoteModal() {
  emailQuoteModal.classList.add(
    'active'
  );

  emailQuoteModal.setAttribute(
    'aria-hidden',
    'false'
  );

  document.body.classList.add(
    'modal-open'
  );
}

function closeQuoteModal() {
  emailQuoteModal.classList.remove(
    'active'
  );

  emailQuoteModal.setAttribute(
    'aria-hidden',
    'true'
  );

  document.body.classList.remove(
    'modal-open'
  );
}

document
  .getElementById('emailQuoteBtn')
  .addEventListener(
    'click',
    openQuoteModal
  );

closeEmailQuoteModal.addEventListener(
  'click',
  closeQuoteModal
);

emailQuoteModal.addEventListener(
  'click',
  event => {
    if (event.target === emailQuoteModal) {
      closeQuoteModal();
    }
  }
);

document.addEventListener(
  'keydown',
  event => {
    if (
      event.key === 'Escape' &&
      emailQuoteModal.classList.contains(
        'active'
      )
    ) {
      closeQuoteModal();
    }
  }
);

document
  .getElementById('submitQuoteReviewBtn')
  .addEventListener('click', () => {
    window.location.href =
      'products.html';
  });

document
  .getElementById('continueBtn5')
  .addEventListener(
    'click',
    checkout.showYourDetails
  );
document
  .getElementById('backBtn7')
  .addEventListener(
    'click',
    showYourQuote
  );

document
  .getElementById('declineModalX')
  .addEventListener(
    'click',
    exitDeclinedQuote
  );

document
  .getElementById('declineCloseBtn')
  .addEventListener(
    'click',
    exitDeclinedQuote
  );

renderQuestions();
checkStep2Complete();

renderVesselFields();
checkStep3Complete();

renderExperienceFields();
addSkipperRow();

renderHistoryQuestions(
  'past5YearsList',
  past5YearsQuestions,
  'past5Years'
);

renderHistoryQuestions(
  'everList',
  everQuestions,
  'ever'
);

document
  .getElementById('addSkipperBtn')
  .addEventListener(
    'click',
    addSkipperRow
  );

document
  .getElementById('addClaimBtn')
  .addEventListener(
    'click',
    addClaimRow
  );

checkStep4Complete();

});
