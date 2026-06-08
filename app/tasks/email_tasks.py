import asyncio
from datetime import datetime, timedelta, timezone

import mailtrap as mt
from sqlalchemy import select, delete

from app.db import AsyncSessionLocal
from app.auth.models import User
from app.celery_app import celery_app
from app.config import get_settings
from app.logging import get_logger



logger = get_logger(__name__)
settings = get_settings()


@celery_app.task(name="send_verification_email", bind=True, max_retries=3)
def send_verification_email(self, to_email: str, code: str):
    try:
        mail = mt.Mail(
            sender=mt.Address(email="noreply@prepario.space", name="Prepario"),
            to=[mt.Address(email=to_email)],
            subject="Verify your Prepario account",
            html=f"""
                <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                    <h2 style="color: #1e293b;">Verify your email</h2>
                    <p style="color: #475569;">Enter this code to verify your account:</p>
                    <div style="font-size: 36px; font-weight: bold; letter-spacing: 10px;
                                padding: 24px; background: #f1f5f9; border-radius: 12px;
                                text-align: center; color: #4f46e5;">
                        {code}
                    </div>
                    <p style="color: #94a3b8; font-size: 13px; margin-top: 16px;">
                        Code expires in 15 minutes. If you didn't request this, ignore this email.
                    </p>
                </div>
            """,
            category="verification",
        )

        client = mt.MailtrapClient(token=settings.mailtrap_api_token)
        client.send(mail)
        logger.info("verification_email_sent", to=to_email)

    except Exception as exc:
        logger.error("verification_email_failed", to=to_email, error=str(exc))
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(name="send_delete_verification_email", bind=True, max_retries=3)
def send_delete_verification_email(self, to_email: str, code: str):
    try:
        mail = mt.Mail(
            sender=mt.Address(email="noreply@prepario.space", name="Prepario"),
            to=[mt.Address(email=to_email)],
            subject="Request for deleting your Prepario account",
            html=f"""
                <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                    <h2 style="color: #1e293b;">Delete your account</h2>
                    <p style="color: #475569;">Enter this code to delete your account:</p>
                    <div style="font-size: 36px; font-weight: bold; letter-spacing: 10px;
                                padding: 24px; background: #f1f5f9; border-radius: 12px;
                                text-align: center; color: #4f46e5;">
                        {code}
                    </div>
                    <p style="color: #94a3b8; font-size: 13px; margin-top: 16px;">
                        Code expires in 15 minutes. If you didn't request this, ignore this email.
                    </p>
                </div>
            """,
            category="verification",
        )

        client = mt.MailtrapClient(token=settings.mailtrap_api_token)
        client.send(mail)
        logger.info("delete_verification_email_sent", to=to_email)

    except Exception as exc:
        logger.error("delete_verification_email_failed", to=to_email, error=str(exc))
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(name="cleanup_unverified_users")
def cleanup_unverified_users():

    async def _cleanup():
        cutoff = datetime.now(timezone.utc) - timedelta(days=7)
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(User).where(
                    User.email_verified == False,
                    User.auth_provider == 'local',
                    User.created_at <= cutoff,
                )
            )
            users = result.scalars().all()
            for user in users:
                await db.delete(user)
            await db.commit()
            logger.info("cleanup_unverified_users", deleted=len(users))

    asyncio.run(_cleanup())
