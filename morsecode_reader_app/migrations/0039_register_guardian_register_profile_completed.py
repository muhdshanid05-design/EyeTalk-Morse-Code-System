from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("morsecode_reader_app", "0038_remove_register_status"),
    ]

    operations = [
        migrations.AddField(
            model_name="register",
            name="profile_completed",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="guardian_register",
            name="profile_completed",
            field=models.BooleanField(default=False),
        ),
    ]
