"""
Availability checking logic
"""
from datetime import datetime, date, time
from typing import Optional

# Optional type for appointment store to avoid circular import
AppointmentStoreType = Optional[object]


async def check_availability(
    date_str: str,
    time_str: str,
    appointment_store: Optional[object] = None,
) -> bool:
    """
    Check if a time slot is available.
    Consults appointment_store (JSON) if provided, otherwise simulated.
    """
    try:
        # Normalize time format (HH:MM or HH:MM:SS)
        if len(time_str) == 5 and ":" in time_str:
            time_str = time_str + ":00"
        elif ":" not in time_str:
            return False

        appointment_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        appointment_time = datetime.strptime(time_str, "%H:%M:%S").time()

        # Business hours: 9 AM to 5 PM
        business_start = time(9, 0)
        business_end = time(17, 0)

        if appointment_time < business_start or appointment_time >= business_end:
            return False

        if appointment_date < date.today():
            return False

        # Check against stored appointments if available
        if appointment_store is not None:
            available = appointment_store.is_slot_available(date_str, time_str)
            return available

        # Simulated: 80% available when no store
        import random
        return random.random() > 0.2

    except Exception:
        return False


def get_available_slots(date_str: str) -> list:
    """
    Get available time slots for a given date.
    Returns slots in HH:MM:SS format.
    """
    slots = []
    for hour in range(9, 17):
        slots.append(f"{hour:02d}:00:00")
        slots.append(f"{hour:02d}:30:00")
    return slots
