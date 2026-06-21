const now = new Date();
const day = now.getDay();
const diff = now.getDate() - day + (day === 0 ? -6 : 1);
const monday = new Date(now.getFullYear(), now.getMonth(), diff);
const dateStr = monday.toISOString().split('T')[0];
output.dateStr = dateStr;
