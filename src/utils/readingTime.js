function readingTimeFromText(text){
  if (!text) return 0;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200)); // at least 1 minute
  return minutes;
}

module.exports = { readingTimeFromText };
