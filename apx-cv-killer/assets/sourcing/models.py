from django.db import models
from django.core.validators import FileExtensionValidator


class JobOffer(models.Model):
    """Model to store uploaded job offers"""
    title = models.CharField(max_length=255)
    description = models.TextField()
    file = models.FileField(
        upload_to='job_offers/',
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'txt', 'docx'])]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Job Offer'
        verbose_name_plural = 'Job Offers'

    def __str__(self):
        return self.title


class SearchSession(models.Model):
    """Model to track a search session for a job offer"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    job_offer = models.ForeignKey(JobOffer, on_delete=models.CASCADE, related_name='search_sessions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    search_query = models.TextField()  # Extracted or user-provided search query
    openclaw_results_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    error_message = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Search for {self.job_offer.title} - {self.status}"


class CandidateProfile(models.Model):
    """Model to store candidate profiles found via Openclaw"""
    search_session = models.ForeignKey(SearchSession, on_delete=models.CASCADE, related_name='candidates')
    source_url = models.URLField()
    source_name = models.CharField(max_length=255)  # LinkedIn, GitHub, Portfolio, etc.
    candidate_name = models.CharField(max_length=255, blank=True)
    raw_data = models.JSONField()  # Store raw data from Openclaw
    hrflow_profile_id = models.CharField(max_length=255, blank=True, null=True)  # Reference to HrFlow profile
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.candidate_name} - {self.source_name}"


class CandidateScore(models.Model):
    """Model to store HrFlow scoring and grading for candidates"""
    candidate = models.OneToOneField(CandidateProfile, on_delete=models.CASCADE, related_name='score')
    hrflow_score = models.FloatField()  # Score from HrFlow API (0-100)
    match_percentage = models.FloatField(default=0)  # Match percentage to job requirements
    skills_match = models.JSONField(default=dict)  # Matched skills
    experience_match = models.JSONField(default=dict)  # Experience match
    user_feedback = models.CharField(
        max_length=50,
        choices=[
            ('relevant', 'Relevant'),
            ('irrelevant', 'Irrelevant'),
            ('maybe', 'Maybe'),
            ('pending', 'Pending')
        ],
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-hrflow_score', '-match_percentage']
        verbose_name_plural = 'Candidate Scores'

    def __str__(self):
        return f"{self.candidate.candidate_name} - {self.hrflow_score}/100"
