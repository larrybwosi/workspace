import { format, isToday, isYesterday } from "date-fns";

export const formatTime = (date: Date | string | number) => {
  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    console.error("Error formatting time: Invalid Date", date);
    return "Invalid time";
  }

  try {
    if (isToday(dateObj)) {
      return format(dateObj, "p");
    }

    if (isYesterday(dateObj)) {
      return "Yesterday";
    }

    return format(dateObj, "MMM d, yyyy");
  } catch (error) {
    console.error("Error formatting time:", error);
    return "Error";
  }
};
