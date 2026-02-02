import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatTime = (date: Date | string | number) => {
  // Ensure we have a valid Date object (Prisma dates are objects, 
  // but sometimes JSON serialization turns them into strings)
  const dateObj = new Date(date);

  // Check for invalid dates to prevent crashes
  if (isNaN(dateObj.getTime())) {
    console.error("Error formatting time: Invalid Date", date);
    return "Invalid time";
  }

  try {
    if (isToday(dateObj)) {
      // Show just the time for today (e.g., "4:30 PM")
      return format(dateObj, "p"); 
    }

    if (isYesterday(dateObj)) {
      return "Yesterday";
    }

    // For everything else, show the date (e.g., "Oct 22, 2025")
    return format(dateObj, "MMM d, yyyy");
    
    // ALTERNATIVE: Use relative time (e.g., "3 days ago")
    // return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    console.error("Error formatting time:", error);
    return "Error";
  }
};