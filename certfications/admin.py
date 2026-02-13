from django.contrib import admin
from .models import Certification,CertificationType,Payment,IDVerificationRequest
admin.site.register(Certification)
admin.site.register(CertificationType)
admin.site.register(Payment)
admin.site.register(IDVerificationRequest)