export const LESSON_CATEGORIES = [
  {
    id: 'home_row',
    title: 'Home Row',
    description: 'Learn the home row keys (f, j, d, k, s, l, a, ;)',
    lessons: [
      { id: 'home_1', title: 'F and J', targetWpm: 10, content: 'f j f j ff jj fj jf f j f j ff jj fj jf', stars: [5, 8, 10, 12, 15] },
      { id: 'home_2', title: 'D and K', targetWpm: 12, content: 'd k d k dd kk dk kd f d j k f d j k', stars: [5, 8, 12, 14, 18] },
      { id: 'home_3', title: 'S and L', targetWpm: 14, content: 's l s l ss ll sl ls d s k l f s j l', stars: [6, 10, 14, 16, 20] },
      { id: 'home_4', title: 'A and ;', targetWpm: 15, content: 'a ; a ; aa ;; a; ;a s a l ; f a j ;', stars: [8, 12, 15, 18, 22] },
      { id: 'home_review', title: 'Home Row Review', targetWpm: 18, content: 'asdf jkl; asdf jkl; a s d f j k l ; sad lad fall dask dash', stars: [10, 14, 18, 22, 25] }
    ]
  },
  {
    id: 'top_row',
    title: 'Top Row',
    description: 'Learn the top row keys (r, u, e, i, q, w, o, p, t, y)',
    lessons: [
      { id: 'top_1', title: 'R and U', targetWpm: 15, content: 'r u r u rr uu fur jur rut fur', stars: [8, 12, 15, 18, 22] },
      { id: 'top_2', title: 'E and I', targetWpm: 18, content: 'e i e i ee ii de ki see rid ire fire', stars: [10, 14, 18, 22, 26] },
      { id: 'top_3', title: 'Q, W, O, P', targetWpm: 20, content: 'q w o p qq ww oo pp po op we ew wop pow', stars: [12, 16, 20, 25, 30] },
      { id: 'top_4', title: 'T and Y', targetWpm: 22, content: 't y t y tt yy toy try yet out put type', stars: [14, 18, 22, 26, 32] },
      { id: 'top_review', title: 'Top Row Review', targetWpm: 25, content: 'top row typewriter require property priority equip quote power your you', stars: [15, 20, 25, 30, 35] }
    ]
  },
  {
    id: 'bottom_row',
    title: 'Bottom Row',
    description: 'Learn the bottom row keys (v, m, c, <, x, >, z, /, b, n)',
    lessons: [
      { id: 'bot_1', title: 'V and M', targetWpm: 20, content: 'v m v m vv mm move vim vim move', stars: [12, 16, 20, 24, 28] },
      { id: 'bot_2', title: 'C and ,', targetWpm: 22, content: 'c , c , cc ,, mac, vac, cap, cop,', stars: [14, 18, 22, 26, 30] },
      { id: 'bot_3', title: 'X and .', targetWpm: 22, content: 'x . x . xx .. max. fox. fix. mix.', stars: [14, 18, 22, 26, 30] },
      { id: 'bot_4', title: 'Z and /', targetWpm: 25, content: 'z / z / zz // zap/ zip/ or/', stars: [15, 20, 25, 30, 35] },
      { id: 'bot_5', title: 'B and N', targetWpm: 25, content: 'b n b n bb nn ban bin nab nob bun', stars: [15, 20, 25, 30, 35] },
      { id: 'bot_review', title: 'Bottom Row Review', targetWpm: 30, content: 'zxcv bnm box cap nimbus mix vapor bottom cab man ban', stars: [18, 24, 30, 35, 40] }
    ]
  },
  {
    id: 'basic_1',
    title: 'Basic Level 1',
    description: 'Basic Keys (Goal 21 WPM)',
    lessons: [
      { id: 'bl1_1', title: 'Review Test', targetWpm: 21, content: 'the quick brown fox jumps over the lazy dog exactly quickly the fox', stars: [15, 18, 21, 26, 30] }
    ]
  },
  {
    id: 'shift_keys',
    title: 'Shift Key',
    description: 'Introduce using the shift keys',
    lessons: [
      { id: 'shift_1', title: 'Left Shift', targetWpm: 20, content: 'A S D F J K L The Quick Brown Fox Jumped Over The Lazy Dog', stars: [14, 18, 20, 25, 30] },
      { id: 'shift_2', title: 'Right Shift', targetWpm: 20, content: 'Q W E R T Y U I O P Z X C V B N M', stars: [14, 18, 20, 25, 30] },
      { id: 'shift_review', title: 'Shift Review', targetWpm: 25, content: 'Make Sure To Use The Correct Shift Key For Capital Letters Like So.', stars: [15, 20, 25, 30, 35] }
    ]
  },
  {
    id: 'basic_2',
    title: 'Basic Level 2',
    description: 'Basic Keys (Goal 30 WPM)',
    lessons: [
      { id: 'bl2_1', title: 'Capitalization Test', targetWpm: 30, content: 'Here is a Test to See How Well you Can Type Capital letters in a Sentence.', stars: [20, 25, 30, 35, 40] }
    ]
  },
  {
    id: 'numbers',
    title: 'Numbers',
    description: 'Introduce how to type numbers',
    lessons: [
      { id: 'num_1', title: '1-5', targetWpm: 25, content: '1 2 3 4 5 123 45 125 34 51 23 1 5 4 3 2 1', stars: [15, 20, 25, 30, 35] },
      { id: 'num_2', title: '6-0', targetWpm: 25, content: '6 7 8 9 0 678 90 67 890 098 76 6 0 9 8 7 6', stars: [15, 20, 25, 30, 35] },
      { id: 'num_review', title: 'Numbers Review', targetWpm: 30, content: '1 2 3 4 5 6 7 8 9 0 12 34 56 78 90 0987 6543 210', stars: [18, 25, 30, 35, 42] }
    ]
  },
  {
    id: 'basic_3',
    title: 'Basic Level 3',
    description: 'Basic Keys and Numbers (Goal 30 WPM)',
    lessons: [
      { id: 'bl3_1', title: 'Numbers and Words', targetWpm: 30, content: 'In 2023 there were 365 days and 12 months with 52 weeks but only 1 year.', stars: [20, 25, 30, 36, 42] }
    ]
  },
  {
    id: 'symbols_1',
    title: 'Symbols',
    description: 'Introducing Symbols',
    lessons: [
      { id: 'sym_1', title: 'Quotes and Quotes', targetWpm: 25, content: "She said, 'Hello there!' and 'How are you?' to him before leaving.", stars: [16, 22, 25, 30, 35] },
      { id: 'sym_2', title: 'Question and Exclamation', targetWpm: 25, content: 'Are you serious?! I cannot believe it! What is going on?', stars: [16, 22, 25, 30, 35] },
      { id: 'sym_review', title: 'Punctuation Review', targetWpm: 30, content: "Wow, really? 'Yes,' he replied! I didn't expect that at all.", stars: [20, 25, 30, 36, 42] }
    ]
  },
  {
    id: 'advanced_1',
    title: 'Advanced Level 1',
    description: 'Speed Goal 45 WPM',
    lessons: [
      { id: 'al1_1', title: 'Intermediate Typing', targetWpm: 45, content: "The quick typing test pushes you to reach 45 WPM with 100% accuracy! Let's see if you can do it!", stars: [30, 38, 45, 55, 65] }
    ]
  },
  {
    id: 'symbols_2',
    title: 'More Symbols',
    description: 'Brackets, Math, and More',
    lessons: [
      { id: 'sym2_1', title: 'Brackets', targetWpm: 25, content: 'An array [1, 2, 3] and object { a: 1 } use parentheses (like this).', stars: [15, 20, 25, 32, 40] },
      { id: 'sym2_2', title: 'Math Symbols', targetWpm: 25, content: '1 + 1 = 2, 4 - 2 = 2, 3 * 3 = 9, 10 / 2 = 5.', stars: [15, 20, 25, 32, 40] },
      { id: 'sym2_3', title: 'Misc Symbols', targetWpm: 25, content: 'Email me @ mark@example.com! We need 100% effort & $500 to succeed.', stars: [15, 20, 25, 32, 40] }
    ]
  },
  {
    id: 'advanced_2',
    title: 'Advanced Level 2',
    description: 'Speed Goal 50 WPM',
    lessons: [
      { id: 'al2_1', title: 'Final Challenge', targetWpm: 50, content: "This is the final test. If you can type this sentence accurately, including numbers like 100 and symbols like %, you have achieved 50 WPM!", stars: [35, 42, 50, 60, 70] }
    ]
  }
];