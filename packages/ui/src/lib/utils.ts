import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isToday, isYesterday } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats full message header timestamps like Discord and Slack.
 * Examples: "Today at 2:30 PM", "Yesterday at 2:30 PM", "03/28/2025 2:30 PM"
 */
export const formatMessageTimestamp = (date: Date | string | number) => {
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';

  try {
    const timeStr = format(dateObj, 'h:mm a');
    if (isToday(dateObj)) {
      return `Today at ${timeStr}`;
    }
    if (isYesterday(dateObj)) {
      return `Yesterday at ${timeStr}`;
    }
    return format(dateObj, 'MM/dd/yyyy h:mm a');
  } catch (error) {
    console.error('Error formatting message timestamp:', error);
    return '';
  }
};

/**
 * Formats condensed hover timestamps for grouped messages in avatar gutter.
 * Examples: "2:30 PM"
 */
export const formatCondensedTime = (date: Date | string | number) => {
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';

  try {
    return format(dateObj, 'h:mm a');
  } catch (error) {
    console.error('Error formatting condensed time:', error);
    return '';
  }
};

export const formatTime = (date: Date | string | number) => {
  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    console.error('Error formatting time: Invalid Date', date);
    return 'Invalid time';
  }

  try {
    if (isToday(dateObj)) {
      return format(dateObj, 'h:mm a');
    }

    if (isYesterday(dateObj)) {
      return 'Yesterday';
    }

    return format(dateObj, 'MMM d, yyyy');
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Error';
  }
};
