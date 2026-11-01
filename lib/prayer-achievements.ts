export const PRAYER_ACHIEVEMENT_MESSAGES = [
  "A journey of transformation begins here.",
  "You chose to show up again.",
  "Something beautiful is taking root.",
  "Every moment in prayer matters.",
  "You’re building something that lasts.",
  "Keep making room for God.",
  "Seven days of intentional prayer.",
  "The journey is becoming a rhythm.",
  "One prayer at a time, keep growing.",
  "Ten days of making prayer a priority.",
  "Keep returning to what matters.",
  "Your commitment is worth nurturing.",
  "Growing deeper, one day at a time.",
  "Two weeks of choosing prayer.",
  "Halfway through. Keep pressing on.",
  "There’s more to discover in His presence.",
  "Make space for what matters most.",
  "The journey continues with grace.",
  "Keep cultivating a life of prayer.",
  "Twenty days of intentional devotion.",
  "Three weeks of showing up.",
  "Let prayer become your daily rhythm.",
  "Keep growing in His presence.",
  "Every day is another opportunity.",
  "Look how far you’ve come.",
  "The finish line is drawing closer.",
  "Keep the flame of prayer alive.",
  "Twenty-eight days of commitment.",
  "One more day. The journey continues.",
  "Thirty days complete. Let the journey continue.",
] as const;

export function prayerAchievementMessage(day: number) {
  if (!Number.isInteger(day) || day < 1 || day > PRAYER_ACHIEVEMENT_MESSAGES.length) return "Your faithful return is worth celebrating.";
  return PRAYER_ACHIEVEMENT_MESSAGES[day - 1];
}

export function verifiedPrayerAchievement(result: unknown) {
  if (!result || typeof result !== "object") return null;
  const checkin = result as { journey_day?: unknown; total_completed?: unknown; current_streak?: unknown; already_checked_in?: unknown };
  if (checkin.already_checked_in === true || !Number.isInteger(checkin.journey_day) || !Number.isInteger(checkin.total_completed) || !Number.isInteger(checkin.current_streak)) return null;
  const day = checkin.journey_day as number;
  const completedDays = checkin.total_completed as number;
  const streak = checkin.current_streak as number;
  if (day < 1 || day > 30 || completedDays < 1 || completedDays > 30 || streak < 1 || streak > 30 || streak > completedDays) return null;
  return { day, completedDays, streak };
}

export function consecutiveStreakAt(localDate: string, completedDates: string[]) {
  const dates = new Set(completedDates);
  let streak = 0;
  const [year, month, day] = localDate.split("-").map(Number);
  if (!year || !month || !day || !dates.has(localDate)) return 0;
  const cursor = new Date(Date.UTC(year, month - 1, day));
  while (dates.has(`${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}-${String(cursor.getUTCDate()).padStart(2, "0")}`)) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export type AchievementFormat = "portrait" | "square";

type AchievementCanvasInput = {
  name: string;
  day: number;
  streak: number;
  completedDays: number;
  format: AchievementFormat;
};

export async function renderPrayerAchievementPng({ name, day, streak, completedDays, format }: AchievementCanvasInput) {
  if (!Number.isInteger(day) || day < 1 || day > 30) throw new Error("Choose a completed day from 1 to 30.");
  if (!Number.isInteger(completedDays) || completedDays < 1 || completedDays > 30) throw new Error("Progress must be between 1 and 30 completed days.");
  if (!Number.isInteger(streak) || streak < 1 || streak > completedDays) throw new Error("The consecutive streak must be within verified completed days.");

  const width = 1080;
  const height = format === "portrait" ? 1920 : 1080;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot create the achievement image.");

  const safeName = name.trim().slice(0, 100) || "Prayer Partner";
  drawBackground(context, width, height, format);
  if (format === "portrait") drawPortrait(context, safeName, day, streak, completedDays);
  else drawSquare(context, safeName, day, streak, completedDays);

  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("The achievement image could not be created.")), "image/png"));
}

function drawBackground(context: CanvasRenderingContext2D, width: number, height: number, format: AchievementFormat) {
  const background = context.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, "#0e251b");
  background.addColorStop(0.52, "#173c2a");
  background.addColorStop(1, "#0a1e16");
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  const glow = context.createRadialGradient(format === "portrait" ? 540 : 790, format === "portrait" ? 1050 : 520, 20, format === "portrait" ? 540 : 790, format === "portrait" ? 1050 : 520, format === "portrait" ? 660 : 420);
  glow.addColorStop(0, "rgba(220,190,117,0.15)");
  glow.addColorStop(1, "rgba(220,190,117,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "rgba(223,207,156,0.38)";
  context.lineWidth = 2;
  context.strokeRect(38, 38, width - 76, height - 76);
  context.strokeStyle = "rgba(223,207,156,0.16)";
  context.lineWidth = 1;
  context.strokeRect(51, 51, width - 102, height - 102);
  drawCorner(context, 70, 70, 1, 1);
  drawCorner(context, width - 70, 70, -1, 1);
  drawCorner(context, 70, height - 70, 1, -1);
  drawCorner(context, width - 70, height - 70, -1, -1);
}

function drawCorner(context: CanvasRenderingContext2D, x: number, y: number, sx: number, sy: number) {
  context.save();
  context.translate(x, y);
  context.scale(sx, sy);
  context.strokeStyle = "rgba(223,207,156,0.72)";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(0, 25); context.lineTo(0, 0); context.lineTo(25, 0);
  context.stroke();
  context.restore();
}

function drawPortrait(context: CanvasRenderingContext2D, name: string, day: number, streak: number, completedDays: number) {
  const left = 100;
  drawBrand(context, left, 150, 880);
  drawRule(context, left, 185, 880);
  drawText(context, `DAY ${pad2(day)} / 30`, left, 260, "600 26px Arial, sans-serif", "#e2ce91");
  drawText(context, "PRAYER STREAK", left, 362, "600 78px Georgia, 'Times New Roman', serif", "#fbf7e9");
  drawText(context, "COMPLETED", left + 4, 425, "600 27px Arial, sans-serif", "#d5c28a");
  drawTrackedText(context, "A PERSONAL MOMENT OF COMMITMENT", left, 485, "600 16px Arial, sans-serif", "rgba(245,239,218,0.72)", 3);

  drawText(context, "CELEBRATING", left, 566, "600 15px Arial, sans-serif", "#d5c28a");
  const nameLines = wrapText(context, name, 870, "500 45px Georgia, 'Times New Roman', serif");
  let nameY = 620;
  for (const line of nameLines.slice(0, 2)) {
    drawText(context, line, left, nameY, "500 45px Georgia, 'Times New Roman', serif", "#fbf7e9");
    nameY += 54;
  }

  const message = prayerAchievementMessage(day);
  drawWrappedText(context, message, left, Math.max(705, nameY + 30), 850, "400 31px Georgia, 'Times New Roman', serif", "#e3d6b0", 2, 42);

  drawVessel(context, 540, 805, 0.78, completedDays);
  const progressY = 1328;
  drawText(context, `${completedDays} OF 30 DAYS COMPLETED`, 540, progressY, "600 21px Arial, sans-serif", "#f1e6c8", "center");
  drawRule(context, 335, progressY + 25, 410);
  drawText(context, `CONSECUTIVE STREAK · ${streak} ${streak === 1 ? "DAY" : "DAYS"}`, 540, progressY + 66, "500 17px Arial, sans-serif", "rgba(245,239,218,0.78)", "center");
  if (completedDays === 30) drawText(context, "THIRTY DAYS COMPLETE · KEEP THE RHYTHM", 540, progressY + 111, "600 15px Arial, sans-serif", "#e2ce91", "center");
  drawFooter(context, 540, 1710, 880);
}

function drawSquare(context: CanvasRenderingContext2D, name: string, day: number, streak: number, completedDays: number) {
  const left = 88;
  drawBrand(context, left, 108, 904);
  drawRule(context, left, 145, 904);
  drawText(context, `DAY ${pad2(day)} / 30`, left, 222, "600 22px Arial, sans-serif", "#e2ce91");
  drawText(context, "PRAYER", left, 320, "600 70px Georgia, 'Times New Roman', serif", "#fbf7e9");
  drawText(context, "STREAK", left, 397, "600 70px Georgia, 'Times New Roman', serif", "#fbf7e9");
  drawText(context, "COMPLETED", left + 3, 440, "600 20px Arial, sans-serif", "#d5c28a");
  drawText(context, "CELEBRATING", left, 520, "600 14px Arial, sans-serif", "#d5c28a");
  const nameLines = wrapText(context, name, 400, "500 35px Georgia, 'Times New Roman', serif");
  let nameY = 566;
  for (const line of nameLines.slice(0, 3)) {
    drawText(context, line, left, nameY, "500 35px Georgia, 'Times New Roman', serif", "#fbf7e9");
    nameY += 43;
  }
  drawWrappedText(context, prayerAchievementMessage(day), left, nameY + 30, 410, "400 23px Georgia, 'Times New Roman', serif", "#e3d6b0", 3, 31);

  drawVessel(context, 780, 216, 0.61, completedDays);
  drawText(context, `${completedDays} / 30 DAYS`, 780, 746, "600 18px Arial, sans-serif", "#f1e6c8", "center");
  drawText(context, `${streak} ${streak === 1 ? "DAY" : "DAYS"} CONSECUTIVE`, 780, 776, "500 13px Arial, sans-serif", "rgba(245,239,218,0.76)", "center");
  if (completedDays === 30) drawText(context, "FULL VESSEL · JOURNEY COMPLETE", 780, 806, "600 12px Arial, sans-serif", "#e2ce91", "center");
  drawRule(context, 88, 875, 904);
  drawText(context, "JOIN THE 30-DAY PRAYER STREAK", 88, 926, "600 17px Arial, sans-serif", "#e2ce91");
  drawText(context, "photizonetwork.com/streak", 88, 966, "400 21px Georgia, 'Times New Roman', serif", "#fbf7e9");
  drawText(context, "PHOTIZO NETWORK INTERNATIONAL", 992, 966, "500 11px Arial, sans-serif", "rgba(245,239,218,0.6)", "right");
}

function drawVessel(context: CanvasRenderingContext2D, centerX: number, top: number, scale: number, completedDays: number) {
  const ratio = completedDays / 30;
  const width = 440;
  const left = centerX - width * scale / 2;
  context.save();
  context.translate(left, top);
  context.scale(scale, scale);

  context.save();
  context.shadowColor = ratio === 1 ? "rgba(248,220,150,0.5)" : "rgba(223,207,156,0.2)";
  context.shadowBlur = ratio === 1 ? 45 : 24;
  context.beginPath();
  vesselPath(context);
  context.clip();

  const interiorBottom = 534;
  const interiorHeight = 440;
  const fillY = interiorBottom - interiorHeight * ratio;
  const liquid = context.createLinearGradient(0, fillY, 0, interiorBottom);
  liquid.addColorStop(0, "rgba(238,211,143,0.95)");
  liquid.addColorStop(0.08, "rgba(207,173,99,0.88)");
  liquid.addColorStop(1, "rgba(149,115,54,0.80)");
  context.fillStyle = liquid;
  context.fillRect(28, fillY, 384, interiorBottom - fillY + 40);
  context.fillStyle = "rgba(255,247,221,0.27)";
  context.fillRect(35, fillY, 370, 5);
  const pool = context.createRadialGradient(220, interiorBottom - 12, 2, 220, interiorBottom - 12, 165);
  pool.addColorStop(0, "rgba(255,239,190,0.45)");
  pool.addColorStop(1, "rgba(255,239,190,0)");
  context.fillStyle = pool;
  context.fillRect(50, interiorBottom - 75, 340, 80);
  context.restore();

  const glass = context.createLinearGradient(55, 0, 380, 0);
  glass.addColorStop(0, "rgba(239,244,223,0.03)");
  glass.addColorStop(0.18, "rgba(242,238,216,0.13)");
  glass.addColorStop(0.48, "rgba(255,255,255,0.025)");
  glass.addColorStop(0.78, "rgba(236,232,205,0.11)");
  glass.addColorStop(1, "rgba(255,255,255,0.035)");
  context.fillStyle = glass;
  context.beginPath(); vesselPath(context); context.fill();

  const outline = context.createLinearGradient(40, 20, 390, 540);
  outline.addColorStop(0, "rgba(255,250,224,0.92)");
  outline.addColorStop(0.48, "rgba(223,207,156,0.88)");
  outline.addColorStop(1, "rgba(255,250,224,0.65)");
  context.strokeStyle = outline;
  context.lineWidth = 5;
  context.beginPath(); vesselPath(context); context.stroke();

  context.strokeStyle = "rgba(255,252,232,0.72)";
  context.lineWidth = 3;
  context.beginPath(); context.moveTo(176, 24); context.lineTo(264, 24); context.moveTo(178, 43); context.lineTo(262, 43); context.stroke();
  context.strokeStyle = "rgba(255,248,220,0.45)";
  context.lineWidth = 7;
  context.beginPath(); context.moveTo(99, 182); context.bezierCurveTo(78, 230, 79, 327, 92, 404); context.stroke();
  context.strokeStyle = "rgba(255,248,220,0.30)";
  context.lineWidth = 4;
  context.beginPath(); context.moveTo(336, 192); context.bezierCurveTo(357, 249, 357, 335, 346, 398); context.stroke();
  context.strokeStyle = "rgba(242,223,174,0.6)";
  context.lineWidth = 3;
  context.beginPath(); context.moveTo(95, 506); context.quadraticCurveTo(220, 535, 345, 506); context.stroke();
  if (ratio === 1) {
    context.strokeStyle = "rgba(255,242,201,0.85)";
    context.lineWidth = 4;
    context.beginPath(); context.moveTo(108, fillY); context.quadraticCurveTo(220, fillY - 8, 332, fillY); context.stroke();
  }
  context.restore();

  if (ratio === 1) {
    context.save();
    context.globalAlpha = 0.95;
    context.fillStyle = "#f1dcaa";
    for (const [x, y, r] of [[66, 112, 3], [377, 129, 2.5], [41, 309, 2], [398, 347, 3], [91, 540, 2.5], [355, 526, 2]]) {
      context.beginPath(); context.arc(x, y, r, 0, Math.PI * 2); context.fill();
    }
    context.restore();
  }
}

function vesselPath(context: CanvasRenderingContext2D) {
  context.beginPath();
  context.moveTo(176, 28);
  context.lineTo(264, 28);
  context.lineTo(264, 94);
  context.bezierCurveTo(264, 112, 290, 122, 315, 141);
  context.bezierCurveTo(354, 171, 368, 224, 370, 290);
  context.bezierCurveTo(373, 372, 364, 454, 349, 503);
  context.bezierCurveTo(338, 539, 310, 556, 281, 556);
  context.lineTo(159, 556);
  context.bezierCurveTo(130, 556, 102, 539, 91, 503);
  context.bezierCurveTo(76, 454, 67, 372, 70, 290);
  context.bezierCurveTo(72, 224, 86, 171, 125, 141);
  context.bezierCurveTo(150, 122, 176, 112, 176, 94);
  context.closePath();
}

function drawBrand(context: CanvasRenderingContext2D, x: number, y: number, width: number) {
  drawTrackedText(context, "PHOTIZO NETWORK INTERNATIONAL", x, y, "600 17px Arial, sans-serif", "#e2ce91", 3.6);
  drawRule(context, x, y + 30, width);
}

function drawFooter(context: CanvasRenderingContext2D, centerX: number, y: number, width: number) {
  drawRule(context, centerX - width / 2, y - 44, width);
  drawText(context, "JOIN THE 30-DAY PRAYER STREAK", centerX, y, "600 19px Arial, sans-serif", "#e2ce91", "center");
  drawText(context, "https://photizonetwork.com/streak", centerX, y + 45, "400 23px Georgia, 'Times New Roman', serif", "#fbf7e9", "center");
  drawText(context, "ONE DAY AT A TIME · A MORE INTENTIONAL LIFE OF PRAYER", centerX, y + 86, "500 13px Arial, sans-serif", "rgba(245,239,218,0.65)", "center");
}

function drawText(context: CanvasRenderingContext2D, text: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = "left") {
  context.font = font;
  context.textAlign = align;
  context.textBaseline = "alphabetic";
  context.fillStyle = color;
  context.fillText(text, x, y);
  context.textAlign = "left";
}

function drawTrackedText(context: CanvasRenderingContext2D, text: string, x: number, y: number, font: string, color: string, spacing: number) {
  context.font = font;
  context.fillStyle = color;
  let cursor = x;
  for (const character of text) {
    context.fillText(character, cursor, y);
    cursor += context.measureText(character).width + spacing;
  }
}

function drawRule(context: CanvasRenderingContext2D, x: number, y: number, width: number) {
  const gradient = context.createLinearGradient(x, y, x + width, y);
  gradient.addColorStop(0, "rgba(223,207,156,0)");
  gradient.addColorStop(0.2, "rgba(223,207,156,0.68)");
  gradient.addColorStop(0.8, "rgba(223,207,156,0.68)");
  gradient.addColorStop(1, "rgba(223,207,156,0)");
  context.strokeStyle = gradient;
  context.lineWidth = 1;
  context.beginPath(); context.moveTo(x, y); context.lineTo(x + width, y); context.stroke();
}

function drawWrappedText(context: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, font: string, color: string, maxLines: number, lineHeight: number) {
  context.font = font;
  context.fillStyle = color;
  for (const [index, line] of wrapText(context, text, width, font).slice(0, maxLines).entries()) context.fillText(line, x, y + index * lineHeight);
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number, font: string) {
  context.font = font;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) { lines.push(line); line = word; }
    else line = candidate;
  }
  if (line) lines.push(line);
  return lines;
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}
