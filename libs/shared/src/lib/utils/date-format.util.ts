/**
 * Formats a date/timestamp to DD/MM/YYYY HH:MM:SS in the user's browser timezone
 * 
 * @param date - Date object, ISO string, or null/undefined
 * @returns Formatted string in DD/MM/YYYY HH:MM:SS format, or empty string if input is null/undefined
 */
export function formatTimestamp(date: Date | string | null | undefined): string {
  if (!date) {
    return '';
  }

  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Ensure we're working with a valid date
  if (isNaN(dateObj.getTime())) {
    return '';
  }

  // Use browser's local timezone
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  const seconds = dateObj.getSeconds().toString().padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

