"""Per-spoke discovery configuration: search URLs, Exa queries, extraction prompts, keyword sets."""

SPOKES = ["work-friendly", "pet-friendly", "rv-ready", "ev-ready", "direct"]

# Known platform domains to EXCLUDE when searching for direct booking sites
PLATFORM_DOMAINS = {
    "airbnb.com", "www.airbnb.com",
    "vrbo.com", "www.vrbo.com",
    "hipcamp.com", "www.hipcamp.com",
    "wander.com", "www.wander.com",
    "booking.com", "www.booking.com",
    "expedia.com", "www.expedia.com",
    "tripadvisor.com", "www.tripadvisor.com",
    "homeaway.com", "www.homeaway.com",
    "glampinghub.com", "www.glampinghub.com",
}

# Independent booking engine footprints (found in HTML/URLs of direct booking sites)
BOOKING_FOOTPRINTS = [
    "ownerrez.com", "powered by OwnerRez",
    "lodgify.com", "powered by Lodgify",
    "firelightcamp.com",
    "beyonder.com",
    "hostfully.com",
    "bookingsync.com",
    "ownerreservations",
    "icnea.net",
    "beds24.com",
    "webchalet.com",
    "supercontrol",
    "tokeet",
]

# Curation/directory sites that list unique independent stays
CURATION_SITES = {
    "boutique_homes": "https://www.boutiquehomes.com/vacation-rentals/united-states",
    "i_escape": "https://www.i-escape.com/united-states",
    "glamping_com": "https://glamping.com/united-states/",
    "dwell_travel": "https://www.dwell.com/travel",
    "getaway_house": "https://www.getaway.house/houses/",
    "autocamp": "https://www.autocamp.com/locations",
    "under_canvas": "https://www.undercanvas.com/locations",
    "collective_retreats": "https://www.collectiveretreats.com/retreats/",
    "cool_stays": "https://www.coolstays.com/country/United-States",
    "unusual_hotels": "https://www.unusualhotelsoftheworld.com/search?country=us",
}

# Platform search URLs with spoke-specific filters
SEARCH_URLS = {
    "work-friendly": {
        "airbnb": [
            "https://www.airbnb.com/s/United-States?amenities%5B%5D=4&refinement_paths%5B%5D=%2Fhomes",
            "https://www.airbnb.com/s/Pacific-Northwest?amenities%5B%5D=4&refinement_paths%5B%5D=%2Fhomes",
            "https://www.airbnb.com/s/New-England?amenities%5B%5D=4&refinement_paths%5B%5D=%2Fhomes",
            "https://www.airbnb.com/s/Colorado?amenities%5B%5D=4&refinement_paths%5B%5D=%2Fhomes",
            "https://www.airbnb.com/s/Tennessee?amenities%5B%5D=4&refinement_paths%5B%5D=%2Fhomes",
        ],
        "vrbo": [
            "https://www.vrbo.com/search?keyword=remote+work+cabin+united+states&amenities=wifi",
            "https://www.vrbo.com/search?keyword=wifi+cabin+workspace+desk+vacation+rental",
        ],
    },
    "pet-friendly": {
        "airbnb": [
            "https://www.airbnb.com/s/United-States?pets_allowed=1&refinement_paths%5B%5D=%2Fhomes",
            "https://www.airbnb.com/s/Pacific-Northwest?pets_allowed=1&refinement_paths%5B%5D=%2Fhomes",
            "https://www.airbnb.com/s/New-England?pets_allowed=1&refinement_paths%5B%5D=%2Fhomes",
            "https://www.airbnb.com/s/Colorado?pets_allowed=1&refinement_paths%5B%5D=%2Fhomes",
            "https://www.airbnb.com/s/Tennessee?pets_allowed=1&refinement_paths%5B%5D=%2Fhomes",
            "https://www.airbnb.com/s/United-States?pets_allowed=1&refinement_paths%5B%5D=%2Fhomes&query=unique+cabin",
            "https://www.airbnb.com/s/United-States?pets_allowed=1&refinement_paths%5B%5D=%2Fhomes&query=treehouse",
            "https://www.airbnb.com/s/United-States?pets_allowed=1&refinement_paths%5B%5D=%2Fhomes&query=dome+glamping",
            "https://www.airbnb.com/s/United-States?pets_allowed=1&refinement_paths%5B%5D=%2Fhomes&query=tiny+home",
        ],
        "vrbo": [
            "https://www.vrbo.com/search?keyword=pet+friendly+unique+vacation+rental&petIncluded=true",
            "https://www.vrbo.com/search?keyword=dog+friendly+cabin+fenced+yard",
        ],
    },
    "rv-ready": {
        "airbnb": [
            "https://www.airbnb.com/s/United-States?refinement_paths%5B%5D=%2Fhomes&query=rv+site+hookup",
            "https://www.airbnb.com/s/United-States?refinement_paths%5B%5D=%2Fhomes&query=airstream+rv+rental",
            "https://www.airbnb.com/s/United-States?refinement_paths%5B%5D=%2Fhomes&query=rv+glamping+unique",
            "https://www.airbnb.com/s/Pacific-Northwest?refinement_paths%5B%5D=%2Fhomes&query=rv+site",
            "https://www.airbnb.com/s/Colorado?refinement_paths%5B%5D=%2Fhomes&query=rv+hookup+camping",
            "https://www.airbnb.com/s/Tennessee?refinement_paths%5B%5D=%2Fhomes&query=airstream+unique",
        ],
    },
    "ev-ready": {
        "airbnb": [
            "https://www.airbnb.com/s/United-States?refinement_paths%5B%5D=%2Fhomes&query=ev+charger+vacation+rental",
            "https://www.airbnb.com/s/United-States?refinement_paths%5B%5D=%2Fhomes&query=tesla+charger+cabin",
        ],
        "vrbo": [
            "https://www.vrbo.com/search?keyword=ev+charger+vacation+rental",
            "https://www.vrbo.com/search?keyword=electric+vehicle+charger+cabin",
        ],
    },
}

# Exa semantic search queries per spoke
EXA_QUERIES = {
    "work-friendly": [
        "vacation rental fast wifi remote work desk",
        "digital nomad cabin high speed internet",
        "work from anywhere retreat wifi workspace unique stay",
        "Starlink cabin vacation rental desk office",
        "treehouse with fast wifi remote work",
        "glamping dome wifi workspace",
    ],
    "pet-friendly": [
        "pet friendly unique cabin vacation rental fenced yard",
        "dog friendly treehouse rental United States",
        "cat friendly vacation rental cabin",
        "pet friendly geodesic dome rental",
        "dog friendly lighthouse stay",
        "pet friendly tiny home rental fenced",
    ],
    "rv-ready": [
        "hipcamp RV hookup site private land",
        "hipcamp full hookup 50 amp RV park unique",
        "RV pad rental private property scenic mountain",
        "Airstream rental unique stay glamping",
        "vintage camper glamping rental unique",
        "luxury RV site private land hot tub",
        "converted school bus tiny home rental",
        "RV site with full hookups private land scenic United States",
    ],
    "ev-ready": [
        "vacation rental with EV charger Tesla",
        "Airbnb EV charging station Level 2",
        "rental cabin electric vehicle charger",
        "VRBO EV charger vacation home",
        "unique stay with Tesla destination charger",
        "treehouse cabin EV charger rental",
    ],
}

# Direct booking Exa queries — no domain restrictions, targets independent properties
EXA_DIRECT_BOOKING_QUERIES = [
    # Generic unique stay queries
    "unique cabin rental direct booking book now site",
    "modern cabin rental book direct own website",
    "design-forward vacation rental book direct United States",
    "boutique glamping site direct booking",
    "treehouse rental book directly own website",
    "luxury cabin direct booking no Airbnb",
    "architect-designed vacation rental book direct",
    # Booking engine footprint queries
    "OwnerRez cabin rental booking United States",
    "Lodgify unique stay vacation rental",
    "independent cabin rental site book directly",
    # Aesthetic/style-specific queries
    "Scandinavian cabin rental book now direct",
    "mid-century modern cabin rental book direct",
    "tiny house rental own website book now",
    "off-grid cabin rental direct booking",
    "lakefront cabin rental book directly",
    # Geographic + unique queries
    "unique cabin rental Texas Hill Country direct booking",
    "modern cabin Catskills Hudson Valley book directly",
    "unique stay Pacific Northwest book direct",
    "cabin rental Joshua Tree direct booking",
    "unique glamping Colorado Rockies own website",
    "boutique cabin Oregon Coast book direct",
    "design cabin rental Vermont book now",
    "unique stay Montana Wyoming direct booking",
]

# Exclusion queries — patterns that indicate NOT a direct booking property
DIRECT_BOOKING_EXCLUDE_TERMS = [
    "airbnb", "vrbo", "booking.com", "expedia", "tripadvisor",
    "hotel chain", "marriott", "hilton", "ihg",
    "aggregator", "directory", "listing", "compare prices",
]

# Spoke-specific LLM extraction instructions
EXTRACTION_PROMPTS = {
    "work-friendly": (
        "Extract all listing details. CRITICAL: Look for WiFi/internet speed mentions "
        "(e.g. '500 Mbps', 'Starlink', 'high-speed WiFi', 'fiber'), dedicated workspace "
        "or desk mentions, and any mentions of 'work from', 'remote work', 'digital nomad'. "
        "Check amenities list for WiFi, workspace, desk, office."
    ),
    "pet-friendly": (
        "Extract all listing details. CRITICAL: Look for pet policy mentions (e.g. 'dogs allowed', "
        "'2 pets max', '$50 pet fee', 'no aggressive breeds'), fenced yard, dog park, pet bed, "
        "'pet-friendly', 'dog-friendly'. Check for pet fees and size/weight restrictions."
    ),
    "rv-ready": (
        "Extract all listing details. CRITICAL: Look for RV hookup mentions (e.g. '30-amp', '50-amp', "
        "'full hookup', 'water/sewer/electric', 'pull-through', 'back-in'), pad size, max rig length, "
        "'RV site', 'campground', 'glamping site', 'electric hookup', 'water hookup'."
    ),
    "ev-ready": (
        "Extract all listing details. CRITICAL: Look for EV charger mentions (e.g. 'Tesla charger', "
        "'Level 2 charger', 'EVSE', 'J1772', 'Wall Connector', 'charging station', 'EV charging'). "
        "Check amenities and description for any electric vehicle charging infrastructure."
    ),
}

# Keyword fallback sets for amenity text scanning
SPOKE_KEYWORDS = {
    "work-friendly": {
        "wifi": ["wifi", "wi-fi", "internet", "high-speed internet", "starlink", "fiber", "mbps", "gigabit"],
        "desk": ["desk", "workspace", "dedicated workspace", "office", "laptop-friendly"],
    },
    "pet-friendly": {
        "pet": ["pet-friendly", "dog-friendly", "pets allowed", "pets welcome", "pet fee", "dogs allowed", "cats allowed"],
        "fenced": ["fenced yard", "fenced garden", "dog run", "enclosed yard", "dog park"],
    },
    "rv-ready": {
        "hookup": ["rv hookup", "rv park", "rv site", "full hookup", "30-amp", "50 amp", "water hookup", "electric hookup", "sewer hookup", "pull-through", "rv pad"],
    },
    "ev-ready": {
        "charger": ["ev charger", "ev charging", "tesla charger", "level 2 charger", "j1772", "evse", "electric vehicle", "charging station", "wall connector", "tesla destination"],
    },
}

# JSON schema for LLM extraction
LISTING_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "location": {"type": "string", "description": "City, State"},
        "state": {"type": "string", "description": "US state full name"},
        "description": {"type": "string", "description": "First 500 chars of listing description"},
        "price": {"type": "number", "description": "Nightly rate in USD"},
        "rating": {"type": "number"},
        "reviewCount": {"type": "number"},
        "sleeps": {"type": "number"},
        "bedrooms": {"type": "number"},
        "imageUrl": {"type": "string", "description": "Primary listing photo URL"},
        "amenities": {"type": "array", "items": {"type": "string"}},
        "wifiSpeed": {"type": "string", "description": "WiFi speed if mentioned (e.g. 200 Mbps)"},
        "hasDesk": {"type": "boolean"},
        "petFriendly": {"type": "boolean"},
        "petPolicy": {"type": "string"},
        "rvHookup": {"type": "boolean"},
        "rvInfo": {"type": "string"},
        "evCharger": {"type": "boolean"},
        "evInfo": {"type": "string"},
    },
    "required": ["title"],
}


def detect_platform(url: str) -> str:
    """Detect platform from URL."""
    if "airbnb.com" in url:
        return "Airbnb"
    elif "vrbo.com" in url or "vacationrentals.com" in url:
        return "VRBO"
    elif "wander.com" in url:
        return "Wander"
    elif "hipcamp.com" in url:
        return "Direct"
    else:
        return "Direct"


def scan_keywords(text: str, spoke: str) -> dict:
    """Fallback: scan text for spoke-specific keywords. Returns found spoke fields."""
    text_lower = text.lower()
    found = {}

    for category, keywords in SPOKE_KEYWORDS.get(spoke, {}).items():
        for kw in keywords:
            if kw in text_lower:
                if category == "wifi":
                    import re
                    speed_match = re.search(r"(\d+)\s*(?:mbps|gbps)", text_lower)
                    if speed_match:
                        found["wifiSpeed"] = speed_match.group(0)
                    found.setdefault("wifiSpeed", "WiFi available (speed not specified)")
                elif category == "desk":
                    found["hasDesk"] = True
                elif category == "pet":
                    found["petFriendly"] = True
                elif category == "hookup":
                    found["rvHookup"] = True
                    found.setdefault("rvInfo", kw)
                elif category == "charger":
                    found["evCharger"] = True
                    found.setdefault("evInfo", kw)
                break

    return found
