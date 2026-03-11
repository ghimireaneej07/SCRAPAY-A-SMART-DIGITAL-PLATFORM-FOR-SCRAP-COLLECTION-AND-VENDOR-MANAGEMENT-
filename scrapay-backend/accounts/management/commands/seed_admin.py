from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from accounts.models import UserRole

User = get_user_model()


class Command(BaseCommand):
    help = "Create or upgrade an application admin account for Scrapay."

    def add_arguments(self, parser):
        parser.add_argument("--username", required=True)
        parser.add_argument("--email", required=True)
        parser.add_argument("--password", required=True)

    def handle(self, *args, **options):
        username = options["username"].strip()
        email = options["email"].strip().lower()
        password = options["password"]

        if len(password) < 8:
            raise CommandError("Password must be at least 8 characters long.")

        existing_by_email = User.objects.filter(email=email).exclude(username=username).first()
        if existing_by_email:
            raise CommandError("Another account already uses that email address.")

        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "role": UserRole.ADMIN,
                "is_staff": True,
                "is_superuser": True,
            },
        )

        user.email = email
        user.role = UserRole.ADMIN
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.set_password(password)
        user.save()

        action = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{action} admin account '{username}' successfully."))
