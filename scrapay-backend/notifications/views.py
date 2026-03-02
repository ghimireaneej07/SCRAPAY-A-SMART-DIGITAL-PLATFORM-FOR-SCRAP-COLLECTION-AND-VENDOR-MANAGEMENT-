from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import NotificationEvent
from .serializers import NotificationEventSerializer


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationEventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return NotificationEvent.objects.filter(recipient=self.request.user)

    @action(detail=True, methods=["patch"], url_path="read")
    def mark_read(self, request, pk=None):
        event = self.get_queryset().filter(pk=pk).first()
        if not event:
            return Response({"detail": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)
        event.is_read = True
        event.save(update_fields=["is_read"])
        return Response(NotificationEventSerializer(event).data, status=status.HTTP_200_OK)

# Create your views here.
