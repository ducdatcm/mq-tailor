/**
 * Slows down password guessing on the admin login page.
 *
 * - 5 wrong attempts from the same IP address lock that address for 15 minutes.
 * - 10 wrong attempts on the same username (from any address) lock that
 *   username for 15 minutes, so spreading guesses across many addresses
 *   doesn't get around the first rule.
 *
 * Counts live in memory: a restart or redeploy clears them, which is fine
 * for a single small site. A successful login clears that IP's count.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_IP = 5;
const MAX_PER_USER = 10;

const byIp = new Map(); // ip -> { count, resetAt }
const byUser = new Map(); // username -> { count, resetAt }

function current(map, key, now) {
  const entry = map.get(key);
  if (!entry) return null;
  if (entry.resetAt <= now) {
    map.delete(key);
    return null;
  }
  return entry;
}

function bump(map, key, now) {
  const entry = current(map, key, now) || { count: 0, resetAt: now + WINDOW_MS };
  entry.count += 1;
  map.set(key, entry);
  return entry;
}

function normalize(username) {
  return String(username || '').trim().toLowerCase();
}

/** Minutes left before this IP/username may try again, or 0 if not locked. */
function lockedFor(ip, username, now = Date.now()) {
  const ipEntry = current(byIp, ip, now);
  const userEntry = username ? current(byUser, normalize(username), now) : null;
  const waits = [];
  if (ipEntry && ipEntry.count >= MAX_PER_IP) waits.push(ipEntry.resetAt - now);
  if (userEntry && userEntry.count >= MAX_PER_USER) waits.push(userEntry.resetAt - now);
  return waits.length ? Math.ceil(Math.max(...waits) / 60000) : 0;
}

function recordFailure(ip, username, now = Date.now()) {
  bump(byIp, ip, now);
  if (username) bump(byUser, normalize(username), now);
}

function recordSuccess(ip, username) {
  byIp.delete(ip);
  if (username) byUser.delete(normalize(username));
}

module.exports = { lockedFor, recordFailure, recordSuccess, MAX_PER_IP, MAX_PER_USER, WINDOW_MS };
