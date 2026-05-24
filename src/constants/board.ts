// 52-cell main path (row, col), clockwise from Red's entry
export const MAIN_PATH: { r: number; c: number }[] = [
  // Red section — up col 6 (rows 13→9)
  { r: 13, c: 6 }, { r: 12, c: 6 }, { r: 11, c: 6 }, { r: 10, c: 6 }, { r: 9, c: 6 },
  // Left across row 8 (cols 5→0)
  { r: 8, c: 5 }, { r: 8, c: 4 }, { r: 8, c: 3 }, { r: 8, c: 2 }, { r: 8, c: 1 }, { r: 8, c: 0 },
  // Up col 0, then right across row 6
  { r: 7, c: 0 }, { r: 6, c: 0 },
  // Right across row 6 (cols 1→5) — Green entry at 13
  { r: 6, c: 1 }, { r: 6, c: 2 }, { r: 6, c: 3 }, { r: 6, c: 4 }, { r: 6, c: 5 },
  // Green section — up col 6 (rows 5→0)
  { r: 5, c: 6 }, { r: 4, c: 6 }, { r: 3, c: 6 }, { r: 2, c: 6 }, { r: 1, c: 6 }, { r: 0, c: 6 },
  // Right across top row 0
  { r: 0, c: 7 }, { r: 0, c: 8 },
  // Yellow section — down col 8 (rows 1→5) — Yellow entry at 26
  { r: 1, c: 8 }, { r: 2, c: 8 }, { r: 3, c: 8 }, { r: 4, c: 8 }, { r: 5, c: 8 },
  // Right across row 6 (cols 9→14)
  { r: 6, c: 9 }, { r: 6, c: 10 }, { r: 6, c: 11 }, { r: 6, c: 12 }, { r: 6, c: 13 }, { r: 6, c: 14 },
  // Down col 14, then left across row 8
  { r: 7, c: 14 }, { r: 8, c: 14 },
  // Left across row 8 (cols 13→9) — Blue entry at 39
  { r: 8, c: 13 }, { r: 8, c: 12 }, { r: 8, c: 11 }, { r: 8, c: 10 }, { r: 8, c: 9 },
  // Blue section — down col 8 (rows 9→14)
  { r: 9, c: 8 }, { r: 10, c: 8 }, { r: 11, c: 8 }, { r: 12, c: 8 }, { r: 13, c: 8 }, { r: 14, c: 8 },
  // Left across bottom row 14
  { r: 14, c: 7 }, { r: 14, c: 6 },
];

// Where each player enters the main path (index into MAIN_PATH)
export const PLAYER_OFFSET = { red: 0, green: 13, yellow: 26, blue: 39 } as const;

// 5-cell home columns (toward center), relative positions 51–55
export const HOME_COLUMNS = {
  red:    [{ r:13,c:7 },{ r:12,c:7 },{ r:11,c:7 },{ r:10,c:7 },{ r:9,c:7 }],
  green:  [{ r:7,c:1  },{ r:7,c:2  },{ r:7,c:3  },{ r:7,c:4  },{ r:7,c:5  }],
  yellow: [{ r:1,c:7  },{ r:2,c:7  },{ r:3,c:7  },{ r:4,c:7  },{ r:5,c:7  }],
  blue:   [{ r:7,c:13 },{ r:7,c:12 },{ r:7,c:11 },{ r:7,c:10 },{ r:7,c:9  }],
} as const;

// Safe squares (global MAIN_PATH indices) — tokens can't be captured here
export const SAFE_INDICES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

// Visual positions of the 4 tokens inside each home base corner
export const TOKEN_BASE_CELLS = {
  red:    [{ r:10,c:1 },{ r:10,c:4 },{ r:13,c:1 },{ r:13,c:4 }],
  green:  [{ r:1, c:1 },{ r:1, c:4 },{ r:4, c:1 },{ r:4, c:4 }],
  yellow: [{ r:1,c:10 },{ r:1,c:13 },{ r:4,c:10 },{ r:4,c:13 }],
  blue:   [{ r:10,c:10},{ r:10,c:13},{ r:13,c:10},{ r:13,c:13}],
} as const;
