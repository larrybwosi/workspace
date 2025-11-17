import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isValid, parseISO } from "date-fns";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const formatTime = (date: Date | string | null | undefined): string => {
  try {
    // Handle null/undefined input
    if (date === null || date === undefined) {
      throw new Error("Date cannot be null or undefined");
    }

    let dateObj: Date;

    // Handle string input by parsing it
    if (typeof date === "string") {
      dateObj = parseISO(date);

      // If parseISO returns an invalid date, try Date constructor as fallback
      if (!isValid(dateObj)) {
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }

    // Validate the date object
    if (!(dateObj instanceof Date) || !isValid(dateObj)) {
      throw new Error("Invalid date provided");
    }

    // Format using date-fns
    return format(dateObj, "h:mm a");
  } catch (error) {
    console.error("Error formatting time:", error);

    // Return a default value or re-throw based on your needs
    return "Invalid time";

    // Alternatively, you could re-throw the error:
    // throw new Error(`Failed to format time: ${error.message}`);
  }
};

// Alternative version that returns null instead of throwing errors
const formatTimeSafe = (
  date: Date | string | null | undefined
): string | null => {
  try {
    if (date === null || date === undefined) {
      return null;
    }

    let dateObj: Date;

    if (typeof date === "string") {
      dateObj = parseISO(date);
      if (!isValid(dateObj)) {
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }

    if (!(dateObj instanceof Date) || !isValid(dateObj)) {
      return null;
    }

    return format(dateObj, "h:mm a");
  } catch (error) {
    console.error("Error formatting time:", error);
    return null;
  }
};