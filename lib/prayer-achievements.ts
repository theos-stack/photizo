export const PRAYER_ACHIEVEMENT_MESSAGES = [
  "Today, you made space for what matters most.",
  "A quiet yes can become a steady rhythm.",
  "Three days of returning, one prayer at a time.",
  "Your consistency is taking root in grace.",
  "Each day of prayer is a seed of hope.",
  "You are building a faithful rhythm, gently.",
  "Seven days of showing up with an open heart.",
  "Your prayers make room for peace to grow.",
  "Keep returning. Small steps carry meaning.",
  "Ten days of choosing a moment with God.",
  "Your steady devotion is a beautiful beginning.",
  "Prayer is shaping the quiet strength within you.",
  "You have made another week of faithful space.",
  "Fourteen days, held together by grace.",
  "Your commitment is becoming a place of rest.",
  "A faithful heart keeps finding its way back.",
  "Every prayer adds another thread of hope.",
  "Your daily return is worth celebrating.",
  "Nineteen days of growing deeper, day by day.",
  "You are making a lasting place for prayer.",
  "Twenty-one days of choosing presence and peace.",
  "Your faithfulness continues to bloom.",
  "Keep walking gently; your progress is real.",
  "You have made room for prayer again today.",
  "Twenty-five days of a heart turned toward God.",
  "Your steady steps tell a story of hope.",
  "The rhythm you are building is a gift.",
  "You are nearing the end with grace and courage.",
  "One more day of devotion, one more quiet yes.",
  "Thirty days of faithful return. Carry this rhythm forward.",
] as const;

export function prayerAchievementMessage(day: number) {
  if (!Number.isInteger(day) || day < 1 || day > PRAYER_ACHIEVEMENT_MESSAGES.length) return "Your faithful return is worth celebrating.";
  return PRAYER_ACHIEVEMENT_MESSAGES[day - 1];
}

export function verifiedPrayerAchievement(result: unknown) {
  if (!result || typeof result !== "object") return null;
  const checkin = result as { journey_day?: unknown; current_streak?: unknown; already_checked_in?: unknown };
  if (checkin.already_checked_in === true || !Number.isInteger(checkin.journey_day) || !Number.isInteger(checkin.current_streak)) return null;
  const day = checkin.journey_day as number;
  const streak = checkin.current_streak as number;
  if (day < 1 || day > 30 || streak < 1 || streak > 30) return null;
  return { day, streak };
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

export async function renderPrayerAchievementPng({ name, day, streak, format }: { name: string; day: number; streak: number; format: AchievementFormat }) {
  const width = 1080;
  const height = format === "portrait" ? 1350 : 1080;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot create the achievement image.");

  const background = context.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, "#102c20");
  background.addColorStop(1, "#254a34");
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);
  context.globalAlpha = 0.16;
  context.strokeStyle = "#dfcf9c";
  context.lineWidth = 3;
  for (let radius = 140; radius < 620; radius += 70) context.strokeRect(width - radius - 120, 110, radius, radius);
  context.globalAlpha = 1;

  const pad = 78;
  const cardTop = 76;
  const cardHeight = height - 152;
  context.fillStyle = "#fbfaf6";
  context.beginPath();
  context.roundRect(pad, cardTop, width - pad * 2, cardHeight, 40);
  context.fill();
  context.strokeStyle = "#d8c58a";
  context.lineWidth = 4;
  context.stroke();

  const left = pad + 72;
  let y = cardTop + 100;
  context.fillStyle = "#60755e";
  context.font = "700 24px Arial, sans-serif";
  context.letterSpacing = "5px";
  context.fillText("PHOTIZO NETWORK INTERNATIONAL", left, y);
  context.letterSpacing = "0px";
  y += 90;
  context.fillStyle = "#173326";
  context.font = "700 80px Georgia, serif";
  context.fillText(`DAY ${day}`, left, y);
  y += 66;
  context.fillStyle = "#a38c4e";
  context.font = "600 33px Arial, sans-serif";
  context.fillText(`${streak} day${streak === 1 ? "" : "s"} consecutive`, left, y);
  y += 74;
  context.fillStyle = "#26352b";
  context.font = "700 42px Georgia, serif";
  const safeName = name.trim().slice(0, 80) || "Prayer Partner";
  const nameLines = wrapText(context, safeName, width - pad * 2 - 144, 56);
  for (const line of nameLines.slice(0, 2)) { context.fillText(line, left, y); y += 54; }
  y += 28;
  context.fillStyle = "#465448";
  context.font = "400 32px Arial, sans-serif";
  const messageLines = wrapText(context, prayerAchievementMessage(day), width - pad * 2 - 144, 44);
  for (const line of messageLines.slice(0, 3)) { context.fillText(line, left, y); y += 46; }

  const footerY = cardTop + cardHeight - 150;
  context.fillStyle = "#173326";
  context.font = "700 26px Arial, sans-serif";
  context.fillText("Join the 30-Day Prayer Streak", left, footerY);
  context.fillStyle = "#60755e";
  context.font = "400 24px Arial, sans-serif";
  context.fillText("https://photizonetwork.com/streak", left, footerY + 42);
  context.fillStyle = "#9c8445";
  context.font = "700 20px Arial, sans-serif";
  context.fillText("30 DAYS · 10 MINUTES · A LIFE OF PRAYER", left, cardTop + cardHeight - 38);

  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("The achievement image could not be created.")), "image/png"));
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number, fontSize: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  context.font = `400 ${fontSize}px Arial, sans-serif`;
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) { lines.push(line); line = word; }
    else line = candidate;
  }
  if (line) lines.push(line);
  return lines;
}
