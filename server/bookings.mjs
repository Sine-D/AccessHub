const bookings = [];

export const queryBookings = async (userId) => {
  return bookings.filter(b => b.userId === userId);
};

export const createBooking = async (bookingData) => {
  const newBooking = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    ...bookingData
  };
  bookings.push(newBooking);
  return newBooking;
};
