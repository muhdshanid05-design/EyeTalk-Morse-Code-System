"""
====================================================
 MORSE ENGINE – CENTRALIZED (FINAL CLEAN VERSION)
 Used by:
  - EyeTalk Communication
  - User Dashboard Navigation
  - Learning Module
  - Game Module
====================================================
"""

# -------------------------------
# MORSE TABLE
# -------------------------------

MORSE_CODE_DICT = {
    # Alphabets
    'A': '.-',    'B': '-...',  'C': '-.-.',  'D': '-..',
    'E': '.',     'F': '..-.',  'G': '--.',   'H': '....',
    'I': '..',    'J': '.---',  'K': '-.-',   'L': '.-..',
    'M': '--',    'N': '-.',    'O': '---',   'P': '.--.',
    'Q': '--.-',  'R': '.-.',   'S': '...',   'T': '-',
    'U': '..-',   'V': '...-',  'W': '.--',   'X': '-..-',
    'Y': '-.--',  'Z': '--..',

    # Numbers
    '0': '-----', '1': '.----', '2': '..---',
    '3': '...--', '4': '....-', '5': '.....',
    '6': '-....', '7': '--...', '8': '---..',
    '9': '----.'
}

# Reverse mapping
REVERSE_MORSE_DICT = {v: k for k, v in MORSE_CODE_DICT.items()}


# -------------------------------
# TEXT → MORSE
# -------------------------------

def encode_morse(text: str) -> str:
    encoded = []

    for char in text.upper():
        if char == " ":
            encoded.append("/")
        elif char in MORSE_CODE_DICT:
            encoded.append(MORSE_CODE_DICT[char])
        else:
            encoded.append("?")

    return " ".join(encoded)


# -------------------------------
# MORSE → TEXT
# -------------------------------

def decode_morse(morse_text: str) -> str:

    if not morse_text:
        return ""

    words = morse_text.strip().split(" / ")
    decoded_words = []

    for word in words:
        letters = word.split()
        decoded_word = ""

        for symbol in letters:
            decoded_word += REVERSE_MORSE_DICT.get(symbol, "?")

        decoded_words.append(decoded_word)

    return " ".join(decoded_words)


# -------------------------------
# GAME HELPERS
# -------------------------------

def normalize_morse(morse: str) -> str:
    return " ".join(morse.strip().split())


def compare_morse(user_morse: str, expected_text: str) -> bool:
    expected_morse = encode_morse(expected_text)
    return normalize_morse(user_morse) == normalize_morse(expected_morse)


# -------------------------------
# DASHBOARD SHORT COMMANDS
# -------------------------------

DASHBOARD_COMMANDS = {
    ".": "NEXT",
    "..": "PREVIOUS",
    "-": "SELECT",
    "--": "BACK"
}

def decode_dashboard_command(morse: str):
    return DASHBOARD_COMMANDS.get(morse.strip())

# -------------------------------
# 4-LEVEL BLINK CLASSIFICATION
# -------------------------------

def classify_blink(duration_ms, settings):

    # Eye control disabled
    if not settings.enable_eye:
        return "DISABLED"

    # Noise protection
    if duration_ms < 100:
        return None

    if duration_ms < settings.short_blink_time:
        return "SHORT"

    elif duration_ms < settings.medium_blink_time:
        return "MEDIUM"

    elif duration_ms < settings.long_blink_time:
        return "LONG"

    else:
        return "EXTRA"
