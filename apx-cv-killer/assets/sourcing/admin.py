from django.contrib import admin
from .models import JobOffer, SearchSession, CandidateProfile, CandidateScore


@admin.register(JobOffer)
class JobOfferAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_at', 'updated_at')
    search_fields = ('title', 'description')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(SearchSession)
class SearchSessionAdmin(admin.ModelAdmin):
    list_display = ('job_offer', 'status', 'openclaw_results_count', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('job_offer__title', 'search_query')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(CandidateProfile)
class CandidateProfileAdmin(admin.ModelAdmin):
    list_display = ('candidate_name', 'source_name', 'source_url', 'created_at')
    list_filter = ('source_name', 'created_at')
    search_fields = ('candidate_name', 'source_url')
    readonly_fields = ('created_at', 'raw_data')


@admin.register(CandidateScore)
class CandidateScoreAdmin(admin.ModelAdmin):
    list_display = ('candidate', 'hrflow_score', 'match_percentage', 'user_feedback')
    list_filter = ('user_feedback', 'hrflow_score')
    search_fields = ('candidate__candidate_name',)
    readonly_fields = ('created_at', 'updated_at')
