from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver





# Create your models here.
class Register(models.Model):
    username=models.TextField(null=True, blank=True,default="no user name added")
    fullname=models.CharField(max_length=100, null=True, blank=True)
    age=models.IntegerField(null=True, blank=True)
    address=models.TextField(null=True, blank=True,default="no address added")
    phone=models. IntegerField(null=True, blank=True)
    email=models.EmailField(unique=True)
    password=models.CharField(max_length=50, null=True, blank=True)
    confirm_password=models.CharField(max_length=50, null=True, blank=True)
    image=models.FileField(upload_to="images/", null=True, blank=True)
    GENDER_CHOICES=[
        ('M','Male'),
        ('F','Female'),
        ('O','Other'),
    ]                       
    gender=models.CharField(max_length=1,choices=GENDER_CHOICES,null=True,blank=True)

    HEALTH_CONDITION_CHOICES = [
    ('paraplegia', 'Paraplegia'),
    ('quadriplegia', 'Quadriplegia'),
    ('hemiplegia', 'Hemiplegia'),
    ('partial', 'Partial Paralysis'),
    ('temporary', 'Temporary Paralysis'),
    ('other', 'Other'),
    ]
    health_condition = models.CharField(max_length=30,choices=HEALTH_CONDITION_CHOICES,null=True,blank=True)

class Feedback(models.Model):
    username=models.TextField(null=True, blank=True,)
    email=models.EmailField(null=True)
    message=models.TextField(null=True, blank=True,default="no address added")
    created_at=models.DateTimeField(auto_now_add=True,null=True)

class guardian_register(models.Model):
    username=models.TextField(null=True, blank=True,default="no user name added")
    fullname=models.CharField(max_length=100, null=True, blank=True)
    age=models.IntegerField(null=True, blank=True)
    address=models.TextField(null=True, blank=True,default="no address added")
    phone=models. IntegerField(null=True, blank=True)
    email=models.EmailField(unique=True)
    password=models.CharField(max_length=50, null=True, blank=True)
    confirm_password=models.CharField(max_length=50, null=True, blank=True)
    image=models.FileField(upload_to="images/", null=True, blank=True)
    GENDER_CHOICES=[
        ('M','Male'),
        ('F','Female'),
        ('O','Other'),
    ]                       
    gender=models.CharField(max_length=1,choices=GENDER_CHOICES,null=True,blank=True)
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')


class GuardianAccessRequest(models.Model):

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    guardian = models.ForeignKey(guardian_register, on_delete=models.CASCADE)
    user = models.ForeignKey(Register, on_delete=models.CASCADE)

    child_name = models.CharField(max_length=100, null=True, blank=True)
    child_dob = models.DateField(null=True, blank=True)
    relation = models.CharField(max_length=50, null=True, blank=True)

    child_address = models.TextField(null=True, blank=True)
    reason = models.TextField(null=True, blank=True)
    proof_image = models.ImageField(upload_to='guardian_proofs/', null=True, blank=True)
    child_email = models.CharField(max_length=100, null=True, blank=True)

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='pending'
    )

    created_at = models.DateTimeField(auto_now_add=True)








class UserSettings(models.Model):
    user = models.OneToOneField(
        Register,
        on_delete=models.CASCADE,
        related_name="settings"
    )

    # ---- 4 Blink Levels ----
    short_blink_time = models.IntegerField(default=300)
    medium_blink_time = models.IntegerField(default=700)
    long_blink_time = models.IntegerField(default=1500)
    extra_long_blink_time = models.IntegerField(default=2000)

    # ---- Sensitivity ----
    blink_sensitivity = models.FloatField(default=0.22)

    # ---- Letter gap ----
    pause_time = models.IntegerField(default=1700)

    # ---- Word gap ----
    word_gap_time = models.IntegerField(default=3000)

    # ---- Feature toggles ----
    enable_eye = models.BooleanField(default=True)
    enable_sos = models.BooleanField(default=True)
    facial_mouse = models.BooleanField(default=False)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Settings of {self.user.email}"


# ==============================
# AUTO CREATE SETTINGS
# ==============================
def create_or_update_user_settings(sender, instance, created, **kwargs):
    if created:
        UserSettings.objects.create(user=instance)
    else:
        # Ensure settings always exist
        UserSettings.objects.get_or_create(user=instance)







class Message(models.Model):
    user = models.ForeignKey(Register, on_delete=models.CASCADE, null=True, blank=True)
    text = models.TextField()
    device_info = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email if self.user else 'Unknown'} - {self.text[:20]}"
    
    
    
# ==========================
# GAME HIGH SCORE MODEL
# ==========================

class GameHighScore(models.Model):
    user = models.OneToOneField(
        Register,
        on_delete=models.CASCADE,
        related_name="game_score"
    )
    high_score = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.user.email} - {self.high_score}"
    
from django.utils import timezone
import datetime

class PasswordResetOTP(models.Model):
    user = models.ForeignKey(Register, null=True, blank=True, on_delete=models.CASCADE)
    guardian = models.ForeignKey(guardian_register, null=True, blank=True, on_delete=models.CASCADE)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() > self.created_at + datetime.timedelta(minutes=10)