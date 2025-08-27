export class TypeUtil {
  static appointmentType(type: string) {
    return {
      new_booking: 'New Booking'
    }[type]
  }
}