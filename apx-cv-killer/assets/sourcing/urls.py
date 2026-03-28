from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('search/<int:search_session_id>/', views.search_results, name='search_results'),
    path('candidate/<int:candidate_id>/', views.candidate_detail, name='candidate_detail'),
    path('candidate/<int:candidate_id>/feedback/', views.update_feedback, name='update_feedback'),
    path('session/<int:search_session_id>/status/', views.session_status, name='session_status'),
]
