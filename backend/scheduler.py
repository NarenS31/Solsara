from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger

scheduler = BackgroundScheduler()


def start_scheduler():
    # polls for new reviews every 30 minutes
    from .services.poller import poll_all_businesses
    scheduler.add_job(
        poll_all_businesses,
        trigger=IntervalTrigger(minutes=30),
        id="poll_reviews",
        replace_existing=True
    )

    # sends weekly summary emails every Monday at 9am
    from .services.email import send_weekly_summaries
    scheduler.add_job(
        send_weekly_summaries,
        trigger=CronTrigger(day_of_week="mon", hour=9, minute=0),
        id="weekly_summary",
        replace_existing=True
    )

    scheduler.start()
    print("Scheduler started")
