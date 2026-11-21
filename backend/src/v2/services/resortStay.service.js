const ResortPackage = require('../models/resortPackage.model');
const ResortRatePeriod = require('../models/resortRatePeriod.model');
const RoomType = require('../models/roomType.model');
const ResortAvailability = require('../models/resortAvailability.model');
const AppError = require('../../error/appError');

const DAY = 86_400_000;

const parseDay = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
};

const coversStay = (periods, checkIn, checkOut) => {
  if (!periods.length) return true; // Active base package, on request.
  const nights = (checkOut - checkIn) / DAY;
  let coveredUntil = checkIn.getTime();
  for (const period of periods) {
    if ((period.minimumStayNights || 0) > nights || period.startDate.getTime() > coveredUntil) continue;
    const lastDay = new Date(period.endDate);
    lastDay.setUTCHours(0, 0, 0, 0);
    coveredUntil = Math.max(coveredUntil, lastDay.getTime() + DAY);
    if (coveredUntil >= checkOut.getTime()) return true;
  }
  return false;
};

const eligibleStayPackages = async (query, packageFilter) => {
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
      .select('package startDate endDate minimumStayNights').sort({ startDate: 1 }).lean(),
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
  return packages.filter(item => {
    if (item.roomType && (resortsByRoom.get(String(item.roomType)) !== String(item.resort) || blocked.has(String(item.roomType)))) return false;
    return coversStay(periodsByPackage.get(String(item._id)) || [], checkIn, checkOut);
  });
};

const resortIdsForStay = async (query, filter) => [...new Set((await eligibleStayPackages(query, filter)).map(item => String(item.resort)))];

module.exports = { parseDay, resortIdsForStay, eligibleStayPackages };
