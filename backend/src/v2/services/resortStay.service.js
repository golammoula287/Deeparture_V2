const ResortPackage = require('../models/resortPackage.model');
const ResortRatePeriod = require('../models/resortRatePeriod.model');
const RoomType = require('../models/roomType.model');
const ResortAvailability = require('../models/resortAvailability.model');
const AppError = require('../../error/appError');
const { discountedRate, resortRatePrice, usdPrice } = require('./pricing.service');

const DAY = 86_400_000;

const parseDay = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
};

const dayStart = date => new Date(date).setUTCHours(0, 0, 0, 0);

function stayPeriods(periods, checkIn, checkOut) {
  const nights = (checkOut - checkIn) / DAY;
  const eligible = periods.filter(period => (period.minimumStayNights || 0) <= nights);
  let coveredUntil = checkIn.getTime();
  for (const period of eligible) {
    if (dayStart(period.startDate) > coveredUntil) break;
    coveredUntil = Math.max(coveredUntil, dayStart(period.endDate) + DAY);
    if (coveredUntil >= checkOut.getTime()) return eligible;
  }
  return null;
}

function startingRate(item, periods, checkIn, checkOut, now) {
  if (!periods.length) return item.basePrice;
  const firstNight = checkIn.getTime();
  let best;
  for (const period of periods) {
    const end = dayStart(period.endDate) + DAY;
    if (dayStart(period.startDate) > firstNight || end <= firstNight) continue;
    const rate = resortRatePrice(item.basePrice, period);
    const discount = end >= checkOut.getTime() ? discountedRate(rate, period.offer, now) : null;
    const candidate = discount || rate;
    const candidateUsd = usdPrice(candidate);
    if (!best || (Number.isFinite(candidateUsd) && candidateUsd < (usdPrice(best) ?? Infinity))) best = candidate;
  }
  return best;
}

const eligibleStayPackages = async (query, packageFilter, { resolvePrices = false, now = new Date() } = {}) => {
  const checkIn = parseDay(query.checkIn);
  const checkOut = parseDay(query.checkOut);
  if (!checkIn || !checkOut || checkOut <= checkIn) {
    throw new AppError(400, 'Use valid check-in and check-out dates, with check-out after check-in.');
  }
  const packages = await ResortPackage.find(packageFilter).select('_id resort roomType basePrice').lean();
  const packageIds = packages.map(item => item._id);
  const roomIds = packages.flatMap(item => item.roomType ? [item.roomType] : []);
  const [periods, rooms, blockedRooms] = await Promise.all([
    ResortRatePeriod.find({ package: { $in: packageIds }, active: true })
      .select(`package startDate endDate minimumStayNights${resolvePrices ? ' priceOverride offer' : ''}`).sort({ startDate: 1, _id: 1 }).lean(),
    RoomType.find({ _id: { $in: roomIds }, active: true }).select('_id resort').lean(),
    ResortAvailability.distinct('roomType', {
      roomType: { $in: roomIds },
      date: { $gte: checkIn, $lt: checkOut },
      status: { $in: ['sold_out', 'stop_sell'] },
    }),
  ]);
  const periodsByPackage = new Map();
  for (const period of periods) {
    const key = String(period.package);
    if (!periodsByPackage.has(key)) periodsByPackage.set(key, []);
    periodsByPackage.get(key).push(period);
  }
  const resortsByRoom = new Map(rooms.map(room => [String(room._id), String(room.resort)]));
  const blocked = new Set(blockedRooms.map(String));
  return packages.flatMap(item => {
    if (item.roomType && (resortsByRoom.get(String(item.roomType)) !== String(item.resort) || blocked.has(String(item.roomType)))) return [];
    const configured = periodsByPackage.get(String(item._id)) || [];
    const periods = configured.length ? stayPeriods(configured, checkIn, checkOut) : [];
    if (periods === null) return [];
    return [resolvePrices ? { ...item, startingRate: startingRate(item, periods, checkIn, checkOut, now) } : item];
  });
};

const resortIdsForStay = async (query, filter) => [...new Set((await eligibleStayPackages(query, filter)).map(item => String(item.resort)))];

module.exports = { parseDay, resortIdsForStay, eligibleStayPackages };
