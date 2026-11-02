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

export const ACHIEVEMENT_VESSEL_PATH = "M80 18h60v50c0 13 19 19 31 31 20 18 29 54 29 101 0 37-4 65-13 82-7 13-19 20-34 20H67c-15 0-27-7-34-20-9-17-13-45-13-82 0-47 9-83 29-101 12-12 31-18 31-31V18Z";

export function prayerAchievementMessage(day: number, completedDays?: number) {
  if (!Number.isInteger(day) || day < 1 || day > PRAYER_ACHIEVEMENT_MESSAGES.length) return "Your faithful return is worth celebrating.";
  if (day === 30 && completedDays !== undefined && completedDays !== 30) return "You showed up for Day 30. Keep the journey going.";
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

  const safeName = (name || "").trim().slice(0, 100);
  drawBackground(context, width, height, format);
  if (format === "portrait") drawPortrait(context, safeName, day, streak, completedDays);
  else drawSquare(context, safeName, day, streak, completedDays);

  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("The achievement image could not be created.")), "image/png"));
}

function drawBackground(context: CanvasRenderingContext2D, width: number, height: number, format: AchievementFormat) {
  context.fillStyle = "#fcf8f1";
  context.fillRect(0, 0, width, height);

  const glowX = format === "portrait" ? width / 2 : width * 0.72;
  const glowY = format === "portrait" ? height * 0.49 : height * 0.45;
  const glow = context.createRadialGradient(glowX, glowY, 8, glowX, glowY, format === "portrait" ? 650 : 430);
  glow.addColorStop(0, "rgba(243,230,222,0.48)");
  glow.addColorStop(0.58, "rgba(250,234,217,0.17)");
  glow.addColorStop(1, "rgba(250,234,217,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  context.fillStyle = "rgba(199,161,108,0.08)";
  context.beginPath();
  context.arc(format === "portrait" ? width - 52 : width - 16, 118, format === "portrait" ? 140 : 100, 0, Math.PI * 2);
  context.fill();
}

function drawPortrait(context: CanvasRenderingContext2D, name: string, day: number, streak: number, completedDays: number) {
  const left = 96;
  drawBrand(context, left, 118, 888);
  drawCapsule(context, "30-DAY PRAYER JOURNEY", left, 222, "#f3e6de", "#745c4d");
  drawCapsule(context, `DAY ${pad2(day)} / 30`, 786, 222, "#f2e5ce", "#76572e", 198);
  drawText(context, "PRAYER STREAK", left, 356, "600 86px Georgia, 'Times New Roman', serif", "#30251f");
  drawText(context, `DAY ${pad2(day)} COMPLETE`, left + 3, 408, "600 24px Arial, sans-serif", "#a87535");
  const milestone = milestoneLabel(day, completedDays);
  if (milestone) drawText(context, milestone.toUpperCase(), left + 3, 455, "600 13px Arial, sans-serif", "#745c4d");

  let messageY = 586;
  if (name) {
    drawText(context, "CELEBRATING", left, 527, "600 14px Arial, sans-serif", "#745c4d");
    const nameLayout = drawName(context, name, left, 586, 888, 48, 31, 3, "#30251f");
    messageY = Math.max(704, nameLayout.bottom + 39);
  }
  const messageLines = drawWrappedText(context, prayerAchievementMessage(day, completedDays), left, messageY, 888, "400 31px Georgia, 'Times New Roman', serif", "#745c4d", 3, 41);

  const vesselTop = Math.max(842, messageY + messageLines * 41 + 34);
  drawVessel(context, 540, vesselTop, 1.36, completedDays);
  const progressY = Math.max(1325, vesselTop + 420);
  drawText(context, `${completedDays} OF 30 DAYS COMPLETED`, 540, progressY, "600 21px Arial, sans-serif", "#30251f", "center");
  drawText(context, `CONSECUTIVE STREAK · ${streak} ${streak === 1 ? "DAY" : "DAYS"}`, 540, progressY + 38, "500 16px Arial, sans-serif", "#745c4d", "center");
  if (completedDays === 30) drawText(context, "THIRTY DAYS COMPLETED · KEEP THE RHYTHM", 540, progressY + 72, "600 13px Arial, sans-serif", "#a87535", "center");
  drawFooter(context, 540, 1694, 888);
}

function drawSquare(context: CanvasRenderingContext2D, name: string, day: number, streak: number, completedDays: number) {
  const left = 76;
  drawBrand(context, left, 74, 928);
  drawCapsule(context, `DAY ${pad2(day)} / 30`, left, 162, "#f2e5ce", "#76572e", 172);
  drawText(context, "PRAYER STREAK", left, 265, "600 62px Georgia, 'Times New Roman', serif", "#30251f");
  drawText(context, `DAY ${pad2(day)} COMPLETE`, left + 2, 306, "600 18px Arial, sans-serif", "#a87535");
  const milestone = milestoneLabel(day, completedDays);
  if (milestone) drawText(context, milestone.toUpperCase(), left + 2, 342, "600 11px Arial, sans-serif", "#745c4d");

  let messageY = 472;
  if (name) {
    drawText(context, "CELEBRATING", left, 424, "600 12px Arial, sans-serif", "#745c4d");
    const nameLayout = drawName(context, name, left, 472, 465, 39, 26, 3, "#30251f");
    messageY = Math.max(600, nameLayout.bottom + 34);
  }
  const messageLines = drawWrappedText(context, prayerAchievementMessage(day, completedDays), left, messageY, 455, "400 23px Georgia, 'Times New Roman', serif", "#745c4d", 3, 31);

  drawVessel(context, 790, 181, 1.11, completedDays);
  drawText(context, `${completedDays} OF 30 DAYS`, 790, 584, "600 17px Arial, sans-serif", "#30251f", "center");
  drawText(context, `${streak} ${streak === 1 ? "DAY" : "DAYS"} CONSECUTIVE`, 790, 613, "500 12px Arial, sans-serif", "#745c4d", "center");
  if (completedDays === 30) drawText(context, "FULL JOURNEY", 790, 640, "600 11px Arial, sans-serif", "#a87535", "center");

  drawRule(context, left, 864 + Math.min(42, messageLines * 10), 928);
  drawText(context, "JOIN THE 30-DAY PRAYER STREAK", left, 922 + Math.min(42, messageLines * 10), "600 15px Arial, sans-serif", "#745c4d");
  drawText(context, "photizonetwork.com/streak", left, 963 + Math.min(42, messageLines * 10), "400 23px Georgia, 'Times New Roman', serif", "#30251f");
  drawText(context, "ONE DAY AT A TIME · A MORE INTENTIONAL LIFE OF PRAYER", 1004, 963 + Math.min(42, messageLines * 10), "500 10px Arial, sans-serif", "#745c4d", "right");
}

function drawVessel(context: CanvasRenderingContext2D, centerX: number, top: number, scale: number, completedDays: number) {
  const ratio = completedDays / 30;
  const left = centerX - 110 * scale;
  const fillBottom = 302;
  const fillHeight = 284;
  const fillY = fillBottom - fillHeight * ratio;
  const path = new Path2D(ACHIEVEMENT_VESSEL_PATH);

  context.save();
  context.translate(left, top);
  context.scale(scale, scale);

  context.save();
  context.shadowColor = ratio === 1 ? "rgba(168,117,53,0.22)" : "rgba(116,92,77,0.12)";
  context.shadowBlur = ratio === 1 ? 20 : 12;
  context.fillStyle = "rgba(255,253,249,0.8)";
  context.fill(path);
  context.restore();

  context.save();
  context.clip(path);
  context.fillStyle = "rgba(255,253,249,0.45)";
  context.fillRect(20, 12, 180, 274);
  const liquid = context.createLinearGradient(0, fillY, 0, fillBottom);
  liquid.addColorStop(0, "#dfc18e");
  liquid.addColorStop(0.2, "#c7a16c");
  liquid.addColorStop(1, "#b4874f");
  context.fillStyle = liquid;
  context.fillRect(20, fillY, 180, fillBottom - fillY + 8);
  if (completedDays > 0) {
    context.strokeStyle = "rgba(255,253,249,0.76)";
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(35, fillY);
    context.quadraticCurveTo(110, fillY - 3, 185, fillY);
    context.stroke();
  }

  const reflection = context.createLinearGradient(34, 0, 75, 0);
  reflection.addColorStop(0, "rgba(255,255,255,0.58)");
  reflection.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = reflection;
  context.beginPath();
  context.moveTo(39, 125);
  context.bezierCurveTo(28, 164, 30, 226, 41, 254);
  context.lineTo(51, 250);
  context.bezierCurveTo(42, 213, 43, 165, 54, 133);
  context.closePath();
  context.fill();
  context.restore();

  const glass = context.createLinearGradient(24, 20, 196, 276);
  glass.addColorStop(0, "rgba(255,255,255,0.23)");
  glass.addColorStop(0.4, "rgba(255,255,255,0.04)");
  glass.addColorStop(1, "rgba(199,161,108,0.12)");
  context.fillStyle = glass;
  context.fill(path);
  context.strokeStyle = "rgba(168,117,53,0.72)";
  context.lineWidth = 1.8;
  context.stroke(path);
  context.strokeStyle = "rgba(255,255,255,0.92)";
  context.lineWidth = 2.6;
  context.beginPath();
  context.moveTo(83, 14);
  context.lineTo(137, 14);
  context.moveTo(85, 25);
  context.lineTo(135, 25);
  context.stroke();
  context.strokeStyle = "rgba(168,117,53,0.35)";
  context.lineWidth = 1.1;
  context.beginPath();
  context.moveTo(75, 8);
  context.lineTo(145, 8);
  context.stroke();
  context.restore();

  if (ratio === 1) {
    context.save();
    context.fillStyle = "#a87535";
    for (const [x, y, radius] of [[28, 105, 1.6], [193, 122, 1.4], [23, 220, 1.3], [199, 224, 1.5]] as const) {
      context.beginPath();
      context.arc(left + x * scale, top + y * scale, radius * scale, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }
}

function drawBrand(context: CanvasRenderingContext2D, x: number, y: number, width: number) {
  drawTrackedText(context, "PHOTIZO NETWORK INTERNATIONAL", x, y, "600 16px Arial, sans-serif", "#30251f", 2.5);
  drawRule(context, x, y + 24, width);
}

function drawFooter(context: CanvasRenderingContext2D, centerX: number, y: number, width: number) {
  drawRule(context, centerX - width / 2, y - 38, width);
  drawText(context, "JOIN THE 30-DAY PRAYER STREAK", centerX, y, "600 16px Arial, sans-serif", "#745c4d", "center");
  drawText(context, "photizonetwork.com/streak", centerX, y + 42, "500 23px Georgia, 'Times New Roman', serif", "#30251f", "center");
  drawText(context, "ONE DAY AT A TIME · A MORE INTENTIONAL LIFE OF PRAYER", centerX, y + 78, "500 12px Arial, sans-serif", "#745c4d", "center");
}

function drawCapsule(context: CanvasRenderingContext2D, text: string, x: number, y: number, background: string, color: string, width?: number) {
  context.font = "600 13px Arial, sans-serif";
  const capsuleWidth = width ?? context.measureText(text).width + 34;
  context.fillStyle = background;
  context.beginPath();
  context.roundRect(x, y - 22, capsuleWidth, 36, 18);
  context.fill();
  drawText(context, text, x + capsuleWidth / 2, y + 2, "600 13px Arial, sans-serif", color, "center");
}

function milestoneLabel(day: number, completedDays: number) {
  if (day === 30) return completedDays === 30 ? "30 days completed" : "Final day check-in";
  if (day === 21) return "Three-week milestone";
  if (day === 15) return "Halfway milestone";
  if (day === 7) return "First-week milestone";
  return "";
}

function drawName(context: CanvasRenderingContext2D, name: string, x: number, y: number, width: number, baseSize: number, minimumSize: number, maxLines: number, color: string) {
  let size = baseSize;
  let lines: string[];
  do {
    lines = wrapText(context, name, width, `500 ${size}px Georgia, 'Times New Roman', serif`);
    if (lines.length <= maxLines || size <= minimumSize) break;
    size -= 2;
  } while (size >= minimumSize);

  const font = `500 ${size}px Georgia, 'Times New Roman', serif`;
  lines = wrapText(context, name, width, font);
  const lineHeight = Math.round(size * 1.18);
  context.font = font;
  context.fillStyle = color;
  lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight, width));
  return { bottom: y + lines.length * lineHeight };
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
  context.strokeStyle = "rgba(168,117,53,0.25)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(x + width, y);
  context.stroke();
}

function drawWrappedText(context: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, font: string, color: string, maxLines: number, lineHeight: number) {
  context.font = font;
  context.fillStyle = color;
  const lines = wrapText(context, text, width, font).slice(0, maxLines);
  lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
  return lines.length;
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number, font: string) {
  context.font = font;
  const lines: string[] = [];
  let line = "";
  for (const word of text.trim().split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (!line || context.measureText(candidate).width <= maxWidth) {
      if (context.measureText(candidate).width <= maxWidth) {
        line = candidate;
        continue;
      }
    }

    if (line) lines.push(line);
    line = "";
    for (const character of Array.from(word)) {
      const next = line + character;
      if (line && context.measureText(next).width > maxWidth) {
        lines.push(line);
        line = character;
      } else line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}
