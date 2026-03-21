/**
 * Word lists for random word typing mode
 */

import englishList from './lists/english.json';
import english1kList from './lists/english_1k.json';
import english5kList from './lists/english_5k.json';

const WORDS_ENGLISH = englishList.words;
const WORDS_ENGLISH_1K = english1kList.words;
const WORDS_ENGLISH_5K = english5kList.words;







export const QUOTES = {
  short: [
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
    { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
    { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
    { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
    { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
    { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
    { text: "The unexamined life is not worth living.", author: "Socrates" },
    { text: "That which does not kill us makes us stronger.", author: "Friedrich Nietzsche" },
    { text: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.", author: "Ralph Waldo Emerson" },
  ],
  medium: [
    { text: "It is not the strongest of the species that survives, nor the most intelligent that survives. It is the one that is most adaptable to change.", author: "Charles Darwin" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts. We must accept finite disappointment, but never lose infinite hope.", author: "Winston Churchill" },
    { text: "The greatest glory in living lies not in never falling, but in rising every time we fall. Our greatest weakness lies in giving up. The most certain way to succeed is always to try just one more time.", author: "Nelson Mandela" },
    { text: "In three words I can sum up everything I have learned about life: it goes on. Life is not measured by the number of breaths we take, but by the moments that take our breath away.", author: "Robert Frost" },
    { text: "Twenty years from now you will be more disappointed by the things that you did not do than by the ones you did do. So throw off the bowlines. Sail away from the safe harbor. Catch the trade winds in your sails.", author: "Mark Twain" },
    { text: "The mind is everything. What you think you become. All that we are is the result of what we have thought. The mind is everything. What you think you become.", author: "Buddha" },
    { text: "Do not go where the path may lead, go instead where there is no path and leave a trail. The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" },
    { text: "Life is really simple, but we insist on making it complicated. It does not matter how slowly you go as long as you do not stop. Our greatest glory is not in never falling, but in rising every time we fall.", author: "Confucius" },
  ],
  long: [
    { text: "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair, we had everything before us, we had nothing before us, we were all going direct to Heaven, we were all going direct the other way.", author: "Charles Dickens" },
    { text: "I went to the woods because I wished to live deliberately, to front only the essential facts of life, and see if I could not learn what it had to teach, and not, when I came to die, discover that I had not lived. I did not wish to live what was not life, living is so dear; nor did I wish to practise resignation, unless it was quite necessary. I wanted to live deep and suck out all the marrow of life.", author: "Henry David Thoreau" },
    { text: "We hold these truths to be self-evident, that all men are created equal, that they are endowed by their Creator with certain unalienable Rights, that among these are Life, Liberty and the pursuit of Happiness. That to secure these rights, Governments are instituted among Men, deriving their just powers from the consent of the governed. That whenever any Form of Government becomes destructive of these ends, it is the Right of the People to alter or to abolish it.", author: "Thomas Jefferson" },
  ],
};

export const CODE_SNIPPETS = {
  javascript: [
    `function fibonacci(n) {\n  if (n <= 1) return n;\n  let a = 0, b = 1;\n  for (let i = 2; i <= n; i++) {\n    [a, b] = [b, a + b];\n  }\n  return b;\n}`,
    `const debounce = (fn, delay) => {\n  let timer = null;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), delay);\n  };\n};`,
    `async function fetchData(url) {\n  try {\n    const response = await fetch(url);\n    if (!response.ok) {\n      throw new Error(response.statusText);\n    }\n    return await response.json();\n  } catch (error) {\n    console.error("Fetch failed:", error);\n    return null;\n  }\n}`,
    `class EventEmitter {\n  constructor() {\n    this.events = {};\n  }\n  on(event, callback) {\n    if (!this.events[event]) {\n      this.events[event] = [];\n    }\n    this.events[event].push(callback);\n    return this;\n  }\n  emit(event, ...args) {\n    const handlers = this.events[event];\n    if (handlers) {\n      handlers.forEach(fn => fn(...args));\n    }\n    return this;\n  }\n}`,
    `const groupBy = (array, key) => {\n  return array.reduce((result, item) => {\n    const group = item[key];\n    result[group] = result[group] || [];\n    result[group].push(item);\n    return result;\n  }, {});\n};`,
    `function deepClone(obj) {\n  if (obj === null || typeof obj !== "object") {\n    return obj;\n  }\n  if (Array.isArray(obj)) {\n    return obj.map(item => deepClone(item));\n  }\n  const cloned = {};\n  for (const key of Object.keys(obj)) {\n    cloned[key] = deepClone(obj[key]);\n  }\n  return cloned;\n}`,
  ],
  python: [
    `def binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1`,
    `class LRUCache:\n    def __init__(self, capacity):\n        self.capacity = capacity\n        self.cache = {}\n        self.order = []\n\n    def get(self, key):\n        if key in self.cache:\n            self.order.remove(key)\n            self.order.append(key)\n            return self.cache[key]\n        return -1\n\n    def put(self, key, value):\n        if key in self.cache:\n            self.order.remove(key)\n        elif len(self.cache) >= self.capacity:\n            oldest = self.order.pop(0)\n            del self.cache[oldest]\n        self.cache[key] = value\n        self.order.append(key)`,
    `def flatten(lst):\n    result = []\n    for item in lst:\n        if isinstance(item, list):\n            result.extend(flatten(item))\n        else:\n            result.append(item)\n    return result`,
    `from functools import wraps\n\ndef memoize(func):\n    cache = {}\n    @wraps(func)\n    def wrapper(*args):\n        if args not in cache:\n            cache[args] = func(*args)\n        return cache[args]\n    return wrapper`,
  ],
  html: [
    `<nav class="navbar">\n  <div class="container">\n    <a href="/" class="logo">Brand</a>\n    <ul class="nav-links">\n      <li><a href="/about">About</a></li>\n      <li><a href="/services">Services</a></li>\n      <li><a href="/contact">Contact</a></li>\n    </ul>\n    <button class="menu-toggle">\n      <span class="bar"></span>\n    </button>\n  </div>\n</nav>`,
    `<form action="/submit" method="POST">\n  <div class="form-group">\n    <label for="email">Email</label>\n    <input type="email" id="email" name="email"\n      placeholder="you@example.com" required />\n  </div>\n  <div class="form-group">\n    <label for="password">Password</label>\n    <input type="password" id="password"\n      name="password" minlength="8" required />\n  </div>\n  <button type="submit">Sign In</button>\n</form>`,
  ],
  css: [
    `.container {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));\n  gap: 1.5rem;\n  padding: 2rem;\n  max-width: 1200px;\n  margin: 0 auto;\n}\n\n.card {\n  background: var(--surface);\n  border-radius: 12px;\n  padding: 1.5rem;\n  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);\n  transition: transform 0.2s ease;\n}\n\n.card:hover {\n  transform: translateY(-4px);\n}`,
    `@keyframes fadeIn {\n  from {\n    opacity: 0;\n    transform: translateY(20px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n\n.animated {\n  animation: fadeIn 0.6s ease-out forwards;\n}\n\n.stagger > * {\n  opacity: 0;\n  animation: fadeIn 0.4s ease-out forwards;\n}\n\n.stagger > *:nth-child(1) { animation-delay: 0.1s; }\n.stagger > *:nth-child(2) { animation-delay: 0.2s; }\n.stagger > *:nth-child(3) { animation-delay: 0.3s; }`,
  ],
};

/**
 * Get a random selection of words
 */
export function getRandomWords(count, difficulty = 'english') {
  const wordList =
    difficulty === 'english_5k' ? WORDS_ENGLISH_5K :
    difficulty === 'english_1k' ? WORDS_ENGLISH_1K :
    WORDS_ENGLISH;

  const words = [];
  for (let i = 0; i < count; i++) {
    words.push(wordList[Math.floor(Math.random() * wordList.length)]);
  }
  return words;
}

/**
 * Get a random quote by length category
 */
export function getRandomQuote(length = 'medium') {
  const quotes = QUOTES[length] || QUOTES.medium;
  return quotes[Math.floor(Math.random() * quotes.length)];
}

/**
 * Get a random code snippet by language
 */
export function getRandomCodeSnippet(language = 'javascript') {
  const snippets = CODE_SNIPPETS[language] || CODE_SNIPPETS.javascript;
  return snippets[Math.floor(Math.random() * snippets.length)];
}

/**
 * Generate timed-mode words (enough to fill the time)
 */
export function getTimedWords(seconds, difficulty = 'english') {
  // Average typist ~40-60 WPM, each word ~5 chars
  // Generate more words than needed to ensure user doesn't run out
  const estimatedWords = Math.ceil((seconds / 60) * 120);
  return getRandomWords(estimatedWords, difficulty);
}

/**
 * Generate daily challenge text using a date seed
 */
export function getDailyText(dateString) {
  // Deterministic pseudo-random based on date
  let seed = 0;
  for (let i = 0; i < dateString.length; i++) {
    seed = ((seed << 5) - seed + dateString.charCodeAt(i)) | 0;
  }

  const pseudoRandom = (max) => {
    seed = (seed * 16807 + 0) % 2147483647;
    return Math.abs(seed) % max;
  };

  const allWords = [...WORDS_ENGLISH, ...WORDS_ENGLISH_1K];
  const words = [];
  for (let i = 0; i < 50; i++) {
    words.push(allWords[pseudoRandom(allWords.length)]);
  }

  return words.join(' ');
}
