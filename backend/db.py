from supabase import create_client, Client
from .config import settings

# creates one supabase client that the whole app shares
supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_key
)
