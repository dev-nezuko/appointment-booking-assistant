"""
Availability rules for the booking flow: business hours, no past dates, and no
slot that the appointment store already holds.
"""
from datetime import date, datetime, time
from typing import List, Optional

OPENING = time(9, 0)
CLOSING = time(17, 0)


async def check_availability(
    date_str: str,
    time_str: str,
    appointment_store: Optional[object] = None,
) -> bool:
    """True when the slot is inside business hours, not in the past and free."""
    if len(time_str) == 5 and ":" in time_str:
        time_str += ":00"
    try:
        appointment_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        appointment_time = datetime.strptime(time_str, "%H:%M:%S").time()
    except ValueError:
        return False

    if not OPENING <= appointment_time < CLOSING:
        return False
    if appointment_date < date.today():
        return False
    if appointment_store is not None:
        return appointment_store.is_slot_available(date_str, time_str)
    return True


def get_available_slots() -> List[str]:
    """Every half-hour start time in business hours, as HH:MM:SS."""
    return [
        f"{hour:02d}:{minute:02d}:00"
        for hour in range(OPENING.hour, CLOSING.hour)
        for minute in (0, 30)
    ]
