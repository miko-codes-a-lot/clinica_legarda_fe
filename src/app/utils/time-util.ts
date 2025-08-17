export class TimeUtil {
  static timeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes
  }

  static calculateEndTime(startTime: string, durationMinutes: number): string {
    const [hours, minutes] = startTime.split(':').map(Number)

    const startTotalMinutes = hours * 60 + minutes

    const endTotalMinutes = startTotalMinutes + durationMinutes

    const endHours = Math.floor(endTotalMinutes / 60)
    const endMinutes = endTotalMinutes % 60

    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
  }
}