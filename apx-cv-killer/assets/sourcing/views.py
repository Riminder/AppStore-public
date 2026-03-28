from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.http import require_http_methods
from django.contrib import messages
from django.core.paginator import Paginator
from .models import JobOffer, SearchSession, CandidateProfile, CandidateScore
from .services import SourcingService
import logging
from threading import Thread

logger = logging.getLogger(__name__)


def index(request):
    """Main page with job offer upload and search results"""
    context = {}

    if request.method == 'POST':
        title = request.POST.get('title', '')
        description = request.POST.get('description', '')
        file = request.FILES.get('file')

        if not title or not description:
            messages.error(request, 'Title and description are required.')
            return render(request, 'sourcing/index.html', context)

        # Create job offer
        job_offer = JobOffer.objects.create(
            title=title,
            description=description,
            file=file if file else None,
        )

        # Create search session
        search_session = SearchSession.objects.create(
            job_offer=job_offer,
            search_query=title,
        )

        # Start sourcing process in background thread
        sourcing_service = SourcingService()
        thread = Thread(
            target=sourcing_service.process_job_offer,
            args=(job_offer, search_session),
            daemon=True
        )
        thread.start()

        messages.success(request, f'Job offer created! Searching for candidates...')
        return redirect('search_results', search_session_id=search_session.id)

    # Show recent job offers
    context['recent_jobs'] = JobOffer.objects.all()[:5]
    context['total_searches'] = SearchSession.objects.count()

    return render(request, 'sourcing/index.html', context)


def search_results(request, search_session_id):
    """Display search results and candidate rankings"""
    search_session = get_object_or_404(SearchSession, id=search_session_id)

    # Get candidates with scores, ranked
    candidates = (
        CandidateProfile.objects
        .filter(search_session=search_session)
        .select_related('score')
        .order_by('-score__hrflow_score', '-score__match_percentage')
    )

    # Pagination
    paginator = Paginator(candidates, 10)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)

    context = {
        'search_session': search_session,
        'page_obj': page_obj,
        'candidates': page_obj.object_list,
        'total_candidates': candidates.count(),
    }

    return render(request, 'sourcing/results.html', context)


@require_http_methods(["POST"])
def update_feedback(request, candidate_id):
    """Update user feedback for a candidate"""
    candidate = get_object_or_404(CandidateProfile, id=candidate_id)
    feedback = request.POST.get('feedback')

    if feedback in ['relevant', 'irrelevant', 'maybe']:
        candidate.score.user_feedback = feedback
        candidate.score.save()
        messages.success(request, 'Feedback recorded!')
    else:
        messages.error(request, 'Invalid feedback value.')

    return redirect('search_results', search_session_id=candidate.search_session.id)


def candidate_detail(request, candidate_id):
    """Show detailed view of a single candidate"""
    candidate = get_object_or_404(CandidateProfile, id=candidate_id)

    context = {
        'candidate': candidate,
        'score': candidate.score if hasattr(candidate, 'score') else None,
    }

    return render(request, 'sourcing/candidate_detail.html', context)


def session_status(request, search_session_id):
    """API endpoint to check search session status (for AJAX polls)"""
    from django.http import JsonResponse

    search_session = get_object_or_404(SearchSession, id=search_session_id)
    candidates_count = search_session.candidates.count()

    return JsonResponse({
        'status': search_session.status,
        'openclaw_results_count': search_session.openclaw_results_count,
        'candidates_processed': candidates_count,
        'error_message': search_session.error_message,
    })
