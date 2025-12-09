from django.db import models
from django.contrib.auth import get_user_model


class Contact(models.Model):
    id = models.BigAutoField(primary_key=True)
    owner = models.ForeignKey(
        get_user_model(), on_delete=models.CASCADE, related_name="contacts"
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField(db_index=True)
    company = models.CharField(max_length=150, blank=True)

    LEAD = "lead"
    ACTIVE = "active"
    INACTIVE = "inactive"
    LOST = "lost"

    STATUS_CHOICES = [
        (LEAD, "Lead"),
        (ACTIVE, "Active"),
        (INACTIVE, "Inactive"),
        (LOST, "Lost"),
    ]

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=LEAD)
    source = models.CharField(
        max_length=100, blank=True, help_text="Where this contact came from"
    )
    next_follow_up_at = models.DateTimeField(null=True, blank=True)
    last_contacted_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["owner", "email"]) ]
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        name = f"{self.first_name} {self.last_name}".strip()
        if name:
            return f"{name} <{self.email}>"
        return self.email
