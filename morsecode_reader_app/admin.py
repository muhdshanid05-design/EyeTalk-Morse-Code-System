from django.contrib import admin
from . import models

# Register your models here.

admin.site.register(models.Register)
admin.site.register(models.Feedback)
admin.site.register(models.guardian_register)
admin.site.register(models.GuardianAccessRequest)
admin.site.register(models.UserSettings)
admin.site.register(models.GameHighScore)
admin.site.register(models.Message)