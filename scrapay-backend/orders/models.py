from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator


class OrderStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    ACCEPTED = "accepted", "Accepted"
    REJECTED = "rejected", "Rejected"
    IN_PROGRESS = "in_progress", "In Progress"
    COMPLETED = "completed", "Completed"
    CANCELLED = "cancelled", "Cancelled"


class Order(models.Model):
    customer = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="customer_orders"
    )
    vendor = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="vendor_orders"
    )
    status = models.CharField(max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING)
    pickup_datetime = models.DateTimeField()
    address = models.TextField()
    customer_note = models.TextField(blank=True)
    total_estimated = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_final = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    pickup_person_name = models.CharField(max_length=255, blank=True)
    pickup_person_contact = models.CharField(max_length=30, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order #{self.id}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    category = models.ForeignKey("catalog.ScrapCategory", on_delete=models.PROTECT)
    quantity_kg = models.DecimalField(max_digits=10, decimal_places=2)
    note = models.TextField(blank=True)
    image_url = models.URLField(blank=True)
    image = models.ImageField(upload_to="order_items/", blank=True, null=True)

    def __str__(self):
        return f"Item {self.category.name} for order {self.order_id}"


class OrderStatusHistory(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="status_history")
    from_status = models.CharField(max_length=20, choices=OrderStatus.choices, blank=True)
    to_status = models.CharField(max_length=20, choices=OrderStatus.choices)
    changed_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-changed_at"]


class OrderFeedback(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="feedback")
    customer = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="order_feedbacks")
    vendor = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="vendor_feedbacks")
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    review = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
