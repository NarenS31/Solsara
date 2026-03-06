from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse, Dial
from ..config import settings
from ..db import supabase

# creates one Twilio client the whole app shares
twilio_client = Client(settings.twilio_account_sid, settings.twilio_auth_token)


def provision_number(business_id: str, real_number: str) -> str:
    if not settings.railway_url:
        raise Exception("Missing RAILWAY_URL env var for Twilio webhooks")
    # extracts area code from their real number
    # real_number format: +17045551234
    area_code = real_number[2:5]

    # searches for available numbers in their area code
    available = twilio_client.available_phone_numbers("US").local.list(
        area_code=area_code,
        voice_enabled=True,
        sms_enabled=True,
        limit=1
    )

    # if no numbers in their area code, fall back to toll free
    if not available:
        available = twilio_client.available_phone_numbers("US").toll_free.list(
            voice_enabled=True,
            sms_enabled=True,
            limit=1
        )

    if not available:
        raise Exception("No available numbers found")

    # buys the number — this charges your Twilio account $1.15/mo
    purchased = twilio_client.incoming_phone_numbers.create(
        phone_number=available[0].phone_number,
        # when a call comes in, Twilio hits this endpoint
        voice_url=f"{settings.railway_url}/calls/incoming",
        voice_method="POST",
        # when a call ends or is missed, Twilio hits this endpoint
        status_callback=f"{settings.railway_url}/calls/status",
        status_callback_method="POST",
        # when someone texts the number, Twilio hits this endpoint
        sms_url=f"{settings.railway_url}/calls/reply",
        sms_method="POST"
    )

    # saves the Twilio number and real number to the business record
    supabase.table("businesses").update({
        "twilio_number": purchased.phone_number,
        "real_number": real_number
    }).eq("id", business_id).execute()

    return purchased.phone_number


def release_number(twilio_number: str):
    # releases the number when a business cancels
    # finds the number in our Twilio account
    numbers = twilio_client.incoming_phone_numbers.list(
        phone_number=twilio_number,
        limit=1
    )

    if numbers:
        # deletes it — stops the $1.15/mo charge
        numbers[0].delete()


def send_missed_call_sms(to_number: str, from_number: str, business_name: str, custom_message: str = None):
    # sends the SMS to whoever missed the call
    # uses custom message if business set one, otherwise uses default
    message = custom_message or f"Hi! You just called {business_name} and we missed you. We'll get back to you shortly — reply here if you need anything sooner."

    twilio_client.messages.create(
        to=to_number,
        from_=from_number,
        body=message
    )


def forward_reply_to_owner(owner_number: str, caller_number: str, reply_text: str, business_name: str):
    # when a caller replies to the SMS, forward it to the business owner's real number
    # owner gets a text from their Twilio number so they can reply directly
    message = f"[Solsara] Reply from {caller_number}:\n\n{reply_text}"

    twilio_client.messages.create(
        to=owner_number,
        from_=owner_number,  # sends from their own Twilio number
        body=message
    )


def build_forward_twiml(real_number: str) -> str:
    # builds TwiML that forwards the call to the business's real number
    # this is what Twilio executes when a call comes in
    response = VoiceResponse()

    # Dial forwards the call — action tells Twilio where to send
    # the status after the call ends or goes unanswered
    dial = Dial(
        action="/calls/status",
        method="POST",
        timeout=20,  # rings for 20 seconds before considering it missed
    )
    dial.number(real_number)
    response.append(dial)

    return str(response)
