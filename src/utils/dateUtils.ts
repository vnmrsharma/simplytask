export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export const formatDateTimeRange = (startDate: string, startTime: string, endDate: string, endTime: string): string => {
  const start = new Date(`${startDate}T${startTime}`);
  const end = new Date(`${endDate}T${endTime}`);
  
  const isSameDay = startDate === endDate;
  
  if (isSameDay) {
    return `${formatDate(startDate)} ${formatTime(startTime)} - ${formatTime(endTime)}`;
  } else {
    return `${formatDate(startDate)} ${formatTime(startTime)} - ${formatDate(endDate)} ${formatTime(endTime)}`;
  }
};

export const isToday = (date: string): boolean => {
  const today = new Date();
  const taskDate = new Date(date);
  return today.toDateString() === taskDate.toDateString();
};

export const isTomorrow = (date: string): boolean => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const taskDate = new Date(date);
  return tomorrow.toDateString() === taskDate.toDateString();
};

export const isOverdue = (endDate: string, endTime: string, completed: boolean): boolean => {
  if (completed) return false;
  const now = new Date();
  const taskEndDate = new Date(`${endDate}T${endTime}`);
  return taskEndDate < now;
};

export const getDaysUntilDue = (endDate: string, endTime: string): number => {
  const now = new Date();
  const taskEndDate = new Date(`${endDate}T${endTime}`);
  const diffTime = taskEndDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getToday = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const getTomorrow = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

export const getCurrentTime = (): string => {
  const now = new Date();
  return now.toTimeString().slice(0, 5); // HH:MM format
};

export const getEndOfDay = (): string => {
  return '23:59';
};