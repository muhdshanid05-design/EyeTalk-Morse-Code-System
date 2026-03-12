from django.contrib import messages
from urllib import request
from django.conf import settings
from django.shortcuts import render,redirect
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse, JsonResponse
from django.urls import reverse
from .import models 
import json
import random
from urllib.parse import urlparse

# Create your views here.
def home(request):
    if 'user_email' not in request.session:
        return redirect('login')

    user = models.Register.objects.get(email=request.session['user_email'])
    return render(request,'home.html',{'user':user})

def index(request):
    return render(request,'index.html')

def register(request):
    if request.method=='POST':
        from_guardian = request.POST.get("from_guardian")
        
        fullname=request.POST.get('fullname')
        username=request.POST.get('username')
        confirm_password=request.POST.get('confirm_password')        
        password=request.POST.get('password')
        phone=request.POST.get('phone')
        age=request.POST.get('age')
        email=request.POST.get('email')
        gender=request.POST.get('gender')
        health_condition = request.POST.get('health_condition')
        
        if password==confirm_password:
            if models.Register.objects.filter(email=email).exists():
                return HttpResponse(' user already exists ')
            user = models.Register(fullname=fullname,
                                   gender=gender,
                                   password=password,
                                   confirm_password=confirm_password,
                                   email=email,
                                   health_condition=health_condition,
                                   phone=phone,
                                   age=age)
            user.save()
            

            # 🔥 AUTO CONNECT LOGIC
            if from_guardian == "1":

                guardian = models.guardian_register.objects.get(
                    email=request.session['guardian_email']
                )

                models.GuardianAccessRequest.objects.create(
                    guardian=guardian,
                    user=user,
                    status='approved'
                )

                return redirect('grd_view_userlist')
            
            return redirect('login')
        return HttpResponse('Passwords do not match ')
    return render(request,'login_register.html', {
        'show_register': True
    })
    
def login(request):
    if request.method=="POST":
        email=request.POST.get("email")
       
        password=request.POST.get("password")
        try:
            user=models.Register.objects.get(email=email)
            if user.password==password:
                request.session["user_email"]=email
                if user.profile_completed:
                    return redirect('home')
                return redirect('edit_profile')
            return HttpResponse('<script>alert("Invalid password");window.location.href="/login/";<script>')
        except models.Register.DoesNotExist: 
            return HttpResponse('<script>alert("Invalid User");window.location.href="/login/";</script>')
    return render(request,'login_register.html', {
        'show_register': False
    })





def logout(request):
    request.session.flush()
    return redirect('index')

def  profile(request):
    if 'user_email' in request.session:
        email = request.session.get('user_email')
        user = models.Register.objects.get(email=email)
        return render(request,'profile.html',{'user':user})
    return redirect('login')  

def edit_profile(request):
    if 'user_email' in request.session:
        email=request.session.get('user_email')
        user=models.Register.objects.get(email=email)
        if request.method == 'POST':
            is_first_profile_completion = not user.profile_completed

            user.fullname = request.POST.get('fullname')
            user.username = request.POST.get('username')
            user.age = request.POST.get('age')
            user.gender = request.POST.get('gender')
            user.health_condition = request.POST.get('health_condition')
            user.phone = request.POST.get('phone')
            user.address = request.POST.get('address')
            if 'avatar' in request.FILES:
                user.image= request.FILES.get('avatar')

            user.profile_completed = True
            user.save()
            if is_first_profile_completion:
                return redirect('home')
            return redirect('profile') 
              
        return render(request,'edit_profile.html',{'user':user}) 
    return redirect('login')    



def admin_login(request):

    if request.method == "POST":

        username = request.POST.get('email')
        password = request.POST.get('password')

        if username == settings.ADMIN_USERNAME and password == settings.ADMIN_PASSWORD:
            request.session['admin'] = "admin@gmail.com"
            return redirect('adminhome')
        else:
            return HttpResponse('<script>alert("Invalid Admin Credentials");window.location.href="/admin_login/";</script>')

    return render(request, 'admin_login.html')







def adminhome(request):
    if 'admin' not in request.session:
        return redirect('admin_login')

    # BASIC COUNTS
    total_users = models.Register.objects.count()
    total_guardians = models.guardian_register.objects.count()
    total_feedback = models.Feedback.objects.count()

    # CONNECTION STATUS COUNTS
    connected_count = models.GuardianAccessRequest.objects.filter(
        status='approved'
    ).count()

    pending_requests = models.GuardianAccessRequest.objects.filter(
        status='pending'
    ).count()

    rejected_count = models.GuardianAccessRequest.objects.filter(
        status='rejected'
    ).count()

    context = {
        # top cards
        'total_users': total_users,
        'total_guardians': total_guardians,
        'total_feedback': total_feedback,
        'pending_requests': pending_requests,

        # graph + highlight
        'connected_count': connected_count,
        'rejected_count': rejected_count,
    }

    return render(request, 'adminhome.html', context)

 


def admin_logout(request):
    request.session.pop('admin', None)
    return redirect('admin_login')






def userlist(request):
    users=models.Register.objects.all()
    return render(request,'userlist.html',{'users':users})

def deleteuser(request,id):
    user=models.Register.objects.get(id=id)
    user.delete()
    return redirect(userlist)

def approve_user(request, id):
    user = models.Register.objects.get(id=id)
    user.status = 'approved'
    user.save()
    return redirect('userlist')


def reject_user(request, id):
    user = models.Register.objects.get(id=id)
    user.status = 'rejected'
    user.save()
    return redirect('userlist')



def feedbackpage(request):
    feedbacks = models.Feedback.objects.all()
    user = None
    redirect_url = 'home'   # default redirect

    # 🔹 Detect logged-in role
    if 'guardian_email' in request.session:
        try:
            user = models.guardian_register.objects.get(
                email=request.session['guardian_email']
            )
            redirect_url = 'guardian_home'
        except models.guardian_register.DoesNotExist:
            user = None

    elif 'user_email' in request.session:
        try:
            user = models.Register.objects.get(
                email=request.session['user_email']
            )
            redirect_url = 'home'
        except models.Register.DoesNotExist:
            user = None

    # 🔹 Handle POST (only once)
    if request.method == 'POST':
        username = request.POST.get('name')
        email = request.POST.get('email')
        message = request.POST.get('message')

        models.Feedback.objects.create(
            username=username,
            email=email,
            message=message
        )

        return redirect(redirect_url)

    return render(request, 'feedback.html', {
        'feedbacks': feedbacks,
        'user': user
    })
    
    
    
def guardian_register(request):
    if request.method=='POST':
        fullname=request.POST.get('fullname')
        username=request.POST.get('username')
        remember=request.POST.get('remember')
        confirm_password=request.POST.get('confirm_password')        
        password=request.POST.get('password')
        phone=request.POST.get('phone')
        age=request.POST.get('age')
        email=request.POST.get('email')
        gender=request.POST.get('gender')
        
        if password==confirm_password:
            if models.guardian_register.objects.filter(email=email).exists():
                return HttpResponse(' user already exists ')
            user = models.guardian_register(fullname=fullname,
                                   gender=gender,
                                   password=password,
                                   confirm_password=confirm_password,
                                   email=email,
                                   phone=phone,
                                   age=age)
            user.save()
            return redirect('guardian_login')
        return HttpResponse('Passwords do not match ')
    return render(request,'guardian_log_reg.html', {
        'show_register': True
    })
    
def guardian_login(request):
    if request.method=="POST":
        email=request.POST.get("email")
      
        password=request.POST.get("password")
        try:
            user=models.guardian_register.objects.get(email=email)
            if user.password==password:
                request.session["guardian_email"]=email
                if user.profile_completed:
                    return redirect('guardian_home')
                return redirect('guardian_edit_profile')
            return HttpResponse('<script>alert("Invalid password");window.location.href="/guardian_login/";<script>')
        except models.guardian_register.DoesNotExist: 
            return HttpResponse('<script>alert("Invalid User");window.location.href="/guardian_login/";</script>')
    return render(request,'guardian_log_reg.html', {
        'show_register': False
    })
   
def guardian_home(request):
    if 'guardian_email' not in request.session:
        return redirect('guardian_login')

    user = models.guardian_register.objects.get(email=request.session['guardian_email'])
    return render(request,'guardian_home.html',{'guardian':user})
    
    
    
def guardian_dashboard(request):
    if 'guardian_email' not in request.session:
        return redirect('guardian_login')

    # Logged-in guardian
    guardian = models.guardian_register.objects.get(
        email=request.session['guardian_email']
    )

    # Guardian approved access requests
    approved_requests = models.GuardianAccessRequest.objects.filter(
        guardian=guardian,
        status='approved'
    )

    # Admin approved users ONLY
    connected_users = models.Register.objects.filter(
        
        id__in=approved_requests.values_list('user_id', flat=True)
    )

    # Counts
    connected_count = connected_users.count()
    active_sessions = connected_count   # simple logic (viva safe)

    return render(
        request,
        'guardian_dashboard.html',
        {
            'guardian': guardian,
            'connected_users': connected_users,
            'connected_count': connected_count,
            'active_sessions': active_sessions,
            'monitor_mode': 'Live'
        }
    )
    
    
def guardian_disconnect_user(request, user_id):

    if 'guardian_email' not in request.session:
        return redirect('guardian_login')

    guardian = models.guardian_register.objects.get(
        email=request.session['guardian_email']
    )

    models.GuardianAccessRequest.objects.filter(
        guardian=guardian,
        user_id=user_id
    ).delete()

    return redirect('guardian_dashboard')


    
def guardian_profile(request):
    if 'guardian_email' not in request.session:
        return redirect('guardian_login')

    email = request.session.get('guardian_email')
    user = models.guardian_register.objects.get(email=email)

    referer = request.META.get('HTTP_REFERER', '')
    referer_path = urlparse(referer).path if referer else ''
    guardian_home_path = reverse('guardian_home')
    guardian_dashboard_path = reverse('guardian_dashboard')
    guardian_edit_profile_path = reverse('guardian_edit_profile')

    if referer_path in {guardian_home_path, guardian_dashboard_path}:
        back_url = referer
        request.session['guardian_profile_back_url'] = back_url
    elif referer_path == guardian_edit_profile_path:
        back_url = request.session.get('guardian_profile_back_url', guardian_home_path)
    else:
        back_url = request.session.get('guardian_profile_back_url', guardian_home_path)

    return render(request, 'guardian_profile.html', {
        'guardian': user,
        'back_url': back_url
    })


def guardian_edit_profile(request):
    if 'guardian_email' not in request.session:
        return redirect('guardian_login')

    email = request.session.get('guardian_email')
    user = models.guardian_register.objects.get(email=email)

    referer = request.META.get('HTTP_REFERER', '')
    referer_path = urlparse(referer).path if referer else ''
    guardian_profile_path = reverse('guardian_profile')
    back_url = referer if referer_path == guardian_profile_path else guardian_profile_path

    if request.method == 'POST':
        user.fullname = request.POST.get('fullname')
        user.username = request.POST.get('username')
        user.age = request.POST.get('age')
        user.gender = request.POST.get('gender')
        user.phone = request.POST.get('phone')
        user.address = request.POST.get('address')

        if 'avatar' in request.FILES:
            user.image = request.FILES.get('avatar')

        user.profile_completed = True
        user.save()

        return redirect('guardian_home')

    return render(request, 'guardian_edit_profile.html', {
        'guardian': user,
        'back_url': back_url
    })


def delete_grd(request,id):
    user=models.guardian_register.objects.get(id=id)
    user.delete()
    return redirect('guardian_list')

def approve_grd(request, id):
    user = models.guardian_register.objects.get(id=id)
    user.status = 'approved'
    user.save()
    return redirect('guardian_list')


def reject_grd(request, id):
    user = models.guardian_register.objects.get(id=id)
    user.status = 'rejected'
    user.save()
    return redirect('guardian_list')

def grd_view_userlist(request):
    # Guardian login check
    if 'guardian_email' not in request.session:
        return redirect('guardian_login')

    # Logged-in guardian
    guardian = models.guardian_register.objects.get(
        email=request.session['guardian_email']
    )

    # All users
    users = models.Register.objects.all()

    # Build a SIMPLE map: user_id -> status (string)
    status_map = {}
    requests = models.GuardianAccessRequest.objects.filter(
        guardian=guardian
    )

    for req in requests:
        status_map[req.user.id] = req.status

    for user in users:
        user.guardian_status = status_map.get(user.id)

    return render(
        request,
        'grd_view_userlist.html',
        {
            'users': users,
            'status_map': status_map,
        }
    )



def request_user_access(request, user_id):
    if 'guardian_email' not in request.session:
        return redirect('guardian_login')

    guardian = models.guardian_register.objects.get(
        email=request.session['guardian_email']
    )
    user = models.Register.objects.get(id=user_id)

    if request.method == "POST":
        child_name = request.POST.get('child_name')
        child_dob = request.POST.get('child_dob')
        relation = request.POST.get('relation')
        child_address = request.POST.get('child_address')
        reason = request.POST.get('reason')
        proof_image = request.FILES.get('proof_image')

        models.GuardianAccessRequest.objects.create(
            guardian=guardian,
            user=user,
            child_name=child_name,
            child_dob=child_dob,
            relation=relation,
            child_address=child_address,
            reason=reason,
            proof_image=proof_image,
            status='pending'
        )

        return redirect('grd_view_userlist')

    
    return render(
        request,
        'guardian_child_verify.html',
        {'user': user}
    )


def admin_guardian_list(request):
    # (Optional) admin login check
    if 'admin' not in request.session:
        return redirect('admin_login')

    guardians = models.guardian_register.objects.all()

    # Build request info per guardian
    guardian_requests = {}

    requests = models.GuardianAccessRequest.objects.all()

    for req in requests:
        # Only keep latest request per guardian
        guardian_requests[req.guardian_id] = req

    return render(
        request,
        'admin_guardian_list.html',
        {
            'guardians': guardians,
            'guardian_requests': guardian_requests
        }
    )


def admin_verify_guardian_request(request, request_id):
    if 'admin' not in request.session:
        return redirect('admin_login')

    # Get the request
    access_request = models.GuardianAccessRequest.objects.get(id=request_id)

    guardian = access_request.guardian
    child = access_request.user

    if request.method == "POST":
        action = request.POST.get('action')

        if action == "approve":
            access_request.status = 'approved'
            access_request.save()

        elif action == "reject":
            access_request.status = 'rejected'
            access_request.save()

        return redirect('guardian_list')

    return render(
        request,
        'admin_verify_guardian_request.html',
        {
            'guardian': guardian,
            'child': child,
            'request': access_request
        }
    )

def guardian_list(request):
    if 'admin' not in request.session:
        return redirect('admin_login')

    guardians = models.guardian_register.objects.all()

    approved = models.GuardianAccessRequest.objects.select_related(
        'guardian','user'
    ).filter(status='approved')

    guardian_map={}
    for g in guardians:
        g.connected_users=[]
        guardian_map[g.id]=g

    for r in approved:
        guardian_map[r.guardian_id].connected_users.append(r)

    # verification status
    req_map = {r.guardian_id:r for r in models.GuardianAccessRequest.objects.all()}
    for g in guardians:
        r=req_map.get(g.id)
        g.request_status=r.status if r else None
        g.request_id=r.id if r else None

    return render(request,'guardian_list.html',{'guardians':guardians})









def admin_disconnect_user(request, req_id):
    if 'admin' not in request.session:
        return redirect('admin_login')

    models.GuardianAccessRequest.objects.filter(id=req_id).delete()

    return redirect('guardian_list')









def eyetalk_prog(request):
    return render(request, 'eyetalk_prog.html')



def save_message(request):
    """
    Expects JSON: {"text":"...","device_info": {...}}
    JS should include X-CSRFToken header (cookie-based CSRF).
    """
    try:
        data = json.loads(request.body.decode('utf-8'))
        text = (data.get('text') or '').strip()[:2000]
        if not text:
            return JsonResponse({'status': 'error', 'error': 'empty'}, status=400)
        device_info = data.get('device_info') or {}
        user = None
        if 'user_email' in request.session:
            try:
                user = models.Register.objects.get(email=request.session['user_email'])
            except models.Register.DoesNotExist:
                user = None
        msg = models.Message.objects.create(text=text, device_info=device_info, user=user)
        return JsonResponse({'status': 'ok', 'id': msg.id})
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'error': 'invalid json'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'error': str(e)}, status=500)
    
    
    
    
    
    
    
    
    
       
    
    
def user_dashboard(request):
    if 'user_email' not in request.session:
        return redirect('login')

    user = models.Register.objects.get(email=request.session['user_email'])
    return render(request,'user_dashboard.html',{'user':user})




def eyetalk_learning(request):
    return render(request,'learning_home.html')

def learning_game(request):
    if 'user_email' not in request.session:
        return redirect('login')

    user = models.Register.objects.get(email=request.session['user_email'])

    try:
        high_score = user.game_score.high_score
    except models.GameHighScore.DoesNotExist:
        high_score = 0

    return render(request, 'learning_game.html', {
        'high_score': high_score
    })










# ================================
# USER SETTINGS (4 BLINK LEVEL SYSTEM)
# ================================

def user_settings(request):
    if 'user_email' not in request.session:
        return redirect('user_login')

    return render(request, 'user_settings.html', {
        'guardian_mode': False
    })




def get_settings(request):
    if "user_email" not in request.session:
        return JsonResponse({"status": "unauthorized"}, status=401)

    user = models.Register.objects.get(email=request.session["user_email"])
    s, _ = models.UserSettings.objects.get_or_create(user=user)

    return JsonResponse({
        "short": s.short_blink_time,
        "medium": s.medium_blink_time,
        "long": s.long_blink_time,
        "extra": s.extra_long_blink_time,
        "ear": s.blink_sensitivity,
        "pause": s.pause_time,
        "word_gap": s.word_gap_time,
        "enable_eye": s.enable_eye,
        "enable_sos": s.enable_sos,
        "facialMouse": s.facial_mouse
    })


@csrf_exempt
def save_settings(request):
    if request.method != "POST":
        return JsonResponse({"status": "invalid"}, status=400)

    if "user_email" not in request.session:
        return JsonResponse({"status": "unauthorized"}, status=401)

    user = models.Register.objects.get(email=request.session["user_email"])
    s, _ = models.UserSettings.objects.get_or_create(user=user)

    data = json.loads(request.body)

    s.short_blink_time = int(data.get("short", s.short_blink_time))
    s.medium_blink_time = int(data.get("medium", s.medium_blink_time))
    s.long_blink_time = int(data.get("long", s.long_blink_time))
    s.extra_long_blink_time = int(data.get("extra", s.extra_long_blink_time))
    
    s.blink_sensitivity = float(data.get("ear", s.blink_sensitivity))
    s.pause_time = int(data.get("pause", s.pause_time))
    s.word_gap_time = int(data.get("word_gap", s.word_gap_time))
    
    s.enable_eye = bool(data.get("enable_eye", s.enable_eye))
    s.enable_sos = bool(data.get("enable_sos", s.enable_sos))
    s.facial_mouse = bool(data.get("facialMouse", s.facial_mouse))
    
    s.save()
    return JsonResponse({"status": "ok"})


@csrf_exempt
def reset_settings(request):

    if request.method != "POST":
        return JsonResponse({"status": "invalid"}, status=400)

    if "user_email" not in request.session:
        return JsonResponse({"status": "unauthorized"}, status=401)

    user = models.Register.objects.get(email=request.session["user_email"])
    s, _ = models.UserSettings.objects.get_or_create(user=user)

    # Match model defaults
    s.short_blink_time = 300
    s.medium_blink_time = 700
    s.long_blink_time = 1500
    s.extra_long_blink_time = 2000
    s.pause_time = 1700
    s.word_gap_time = 3000
    s.blink_sensitivity = 0.22

    s.enable_eye = True
    s.enable_sos = True
    s.facial_mouse = False

    s.save()

    return JsonResponse({"status": "reset"})


# =========================================
# GUARDIAN → USER SETTINGS CONTROL
# =========================================
def guardian_user_settings(request, user_id):
    if 'guardian_email' not in request.session:
        return redirect('guardian_login')

    guardian = models.guardian_register.objects.get(
        email=request.session['guardian_email']
    )

    access = models.GuardianAccessRequest.objects.filter(
        guardian=guardian,
        user_id=user_id,
        status='approved'
    ).exists()

    if not access:
        return HttpResponse("Access Denied")

    user = models.Register.objects.get(id=user_id)

    return render(request, 'user_settings.html', {
        'guardian_mode': True,
        'target_user': user
    })

@csrf_exempt
def guardian_get_user_settings(request, user_id):

    if 'guardian_email' not in request.session:
        return JsonResponse({"status": "unauthorized"}, status=401)

    guardian = models.guardian_register.objects.get(
        email=request.session['guardian_email']
    )

    access = models.GuardianAccessRequest.objects.filter(
        guardian=guardian,
        user_id=user_id,
        status='approved'
    ).exists()

    if not access:
        return JsonResponse({'status': 'access_denied'}, status=403)

    user = models.Register.objects.get(id=user_id)
    s, _ = models.UserSettings.objects.get_or_create(user=user)

    return JsonResponse({
        "short": s.short_blink_time,
        "medium": s.medium_blink_time,
        "long": s.long_blink_time,
        "extra": s.extra_long_blink_time,
        "ear": s.blink_sensitivity,
        "pause": s.pause_time,
        "word_gap": s.word_gap_time,
        "enable_eye": s.enable_eye,
        "enable_sos": s.enable_sos,
        "facialMouse": s.facial_mouse
    })
@csrf_exempt
def guardian_save_user_settings(request, user_id):

    if 'guardian_email' not in request.session:
        return JsonResponse({"status": "unauthorized"}, status=401)

    guardian = models.guardian_register.objects.get(
        email=request.session['guardian_email']
    )

    access = models.GuardianAccessRequest.objects.filter(
        guardian=guardian,
        user_id=user_id,
        status='approved'
    ).exists()

    if not access:
        return JsonResponse({'status': 'access_denied'}, status=403)

    user = models.Register.objects.get(id=user_id)
    s, _ = models.UserSettings.objects.get_or_create(user=user)

    data = json.loads(request.body)

    s.short_blink_time = int(data.get("short", s.short_blink_time))
    s.medium_blink_time = int(data.get("medium", s.medium_blink_time))
    s.long_blink_time = int(data.get("long", s.long_blink_time))
    s.extra_long_blink_time = int(data.get("extra", s.extra_long_blink_time))

    s.blink_sensitivity = float(data.get("ear", s.blink_sensitivity))
    s.pause_time = int(data.get("pause", s.pause_time))
    s.word_gap_time = int(data.get("word_gap", s.word_gap_time))

    s.enable_eye = bool(data.get("enable_eye", s.enable_eye))
    s.enable_sos = bool(data.get("enable_sos", s.enable_sos))
    s.facial_mouse = bool(data.get("facialMouse", s.facial_mouse))


    s.save()
    return JsonResponse({"status": "ok"})


@csrf_exempt
def guardian_reset_settings(request, user_id):

    if request.method != "POST":
        return JsonResponse({"status": "invalid"}, status=400)

    if "guardian_email" not in request.session:
        return JsonResponse({"status": "unauthorized"}, status=401)

    guardian = models.guardian_register.objects.get(
        email=request.session["guardian_email"]
    )

    access = models.GuardianAccessRequest.objects.filter(
        guardian=guardian,
        user_id=user_id,
        status='approved'
    ).exists()

    if not access:
        return JsonResponse({"status": "access_denied"}, status=403)

    user = models.Register.objects.get(id=user_id)
    s, _ = models.UserSettings.objects.get_or_create(user=user)

    # MODEL DEFAULT VALUES
    s.short_blink_time = 300
    s.medium_blink_time = 700
    s.long_blink_time = 1500
    s.extra_long_blink_time = 2000
    s.pause_time = 1700
    s.word_gap_time = 3000
    s.blink_sensitivity = 0.22
    
    s.enable_eye = True
    s.enable_sos = True
    s.facial_mouse = False

    s.save()

    return JsonResponse({"status": "reset"})






# views.py (ADD THIS AT BOTTOM)

from django.views.decorators.csrf import csrf_exempt
from .eye import classify_blink, decode_morse
import json

# temporary in-memory buffer (simple version)

@csrf_exempt
def api_blink(request):

    if request.method != "POST":
        return JsonResponse({"error": "invalid method"}, status=400)

    if 'user_email' not in request.session:
        return JsonResponse({"error": "not logged in"}, status=401)

    user = models.Register.objects.get(email=request.session['user_email'])
    settings = models.UserSettings.objects.get(user=user)

    # SAFE JSON PARSE
    try:
        data = json.loads(request.body) if request.body else {}
    except:
        data = {}

    duration = int(data.get("duration", 0))

    blink_type = classify_blink(duration, settings)

    return JsonResponse({
        "blink": blink_type
    })


    

from .eye import decode_morse

@csrf_exempt
def api_decode_morse(request):
    if request.method != "POST":
        return JsonResponse({"error": "invalid method"}, status=400)

    data = json.loads(request.body.decode("utf-8"))
    morse = data.get("morse", "").strip()

    if not morse:
        return JsonResponse({"letter": ""})

    letter = decode_morse(morse)

    return JsonResponse({
        "letter": letter
    })

    if request.method != "POST":
        return JsonResponse({"error": "invalid method"}, status=400)

    data = json.loads(request.body.decode("utf-8"))
    morse = data.get("morse", "").strip()

    if not morse:
        return JsonResponse({"letter": ""})

    # morse = "...." → ['.', '.', '.', '.']
    letter = decode_morse(morse)

    return JsonResponse({
        "letter": letter
    })



from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.shortcuts import redirect
from django.http import HttpResponse

def trigger_sos(request):
    if request.method == "POST":

        # Get logged-in user email from session
        email = request.session.get("user_email")

        if not email:
            return HttpResponse("User not logged in", status=401)

        try:
            user = models.Register.objects.get(email=email)
        except models.Register.DoesNotExist:
            return HttpResponse("Invalid user", status=400)

        # Get only APPROVED guardians connected to this user
        approved_requests = models.GuardianAccessRequest.objects.filter(
            user=user,
            status='approved'
        )

        if not approved_requests.exists():
            return HttpResponse("No guardian connected", status=400)

        # Collect guardian emails
        guardian_emails = [
            req.guardian.email
            for req in approved_requests
            if req.guardian.email
        ]

        # Email content
        subject = "🚨 EMERGENCY SOS ALERT"
        message = f"""
EMERGENCY ALERT 🚨

User: {user.fullname}
Phone: {user.phone}

This is an emergency SOS signal from EyeTalk system.

Time: {timezone.now().strftime('%d %b %Y, %H:%M')}

Please respond immediately.
"""

        # Send Email
        if guardian_emails:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                guardian_emails,
                fail_silently=True
            )

        return HttpResponse(
            '<script>alert("SOS triggered! Guardian notified.");window.location.href="/user_dashboard/";</script>'
        )

    return HttpResponse(
            '<script>alert("SOS ERROR");window.location.href="/user_dashboard/";</script>'
        )











def calibration_page(request):
    if 'user_email' not in request.session:
        return redirect('login')
    return render(request, 'calibration.html')











def guardian_view_user_messages(request, user_id):

    if 'guardian_email' not in request.session:
        return redirect('guardian_login')

    guardian = models.guardian_register.objects.get(
        email=request.session['guardian_email']
    )

    # CHECK APPROVED CONNECTION
    access = models.GuardianAccessRequest.objects.filter(
        guardian=guardian,
        user_id=user_id,
        status='approved'
    ).exists()

    if not access:
        return HttpResponse("Access Denied")

    user = models.Register.objects.get(id=user_id)

    # Get High Score
    try:
        high_score = user.game_score.high_score
    except:
        high_score = 0
    
    
    messages = models.Message.objects.filter(
        user=user
    ).order_by('-created_at')

    return render(request, 'guardian_user_messages.html', {
        'target_user': user,
        'messages': messages,
        'high_score': high_score
    })



def guardian_delete_message(request, message_id):

    if 'guardian_email' not in request.session:
        return redirect('guardian_login')

    guardian = models.guardian_register.objects.get(
        email=request.session['guardian_email']
    )

    message = models.Message.objects.get(id=message_id)
    user = message.user

    # Check approved access
    access = models.GuardianAccessRequest.objects.filter(
        guardian=guardian,
        user=user,
        status='approved'
    ).exists()

    if not access:
        return HttpResponse("Access Denied")

    message.delete()

    return redirect('guardian_user_messages', user_id=user.id)




@csrf_exempt
def save_game_score(request):
    if request.method != "POST":
        return JsonResponse({"status": "invalid"}, status=400)

    if "user_email" not in request.session:
        return JsonResponse({"status": "unauthorized"}, status=401)

    user = models.Register.objects.get(email=request.session["user_email"])
    data = json.loads(request.body)
    new_score = int(data.get("score", 0))

    obj, created = models.GameHighScore.objects.get_or_create(user=user)

    if new_score > obj.high_score:
        obj.high_score = new_score
        obj.save()
        return JsonResponse({"status": "new_highscore", "high_score": obj.high_score})

    return JsonResponse({"status": "no_change", "high_score": obj.high_score})













def mask_email(email):
    name, domain = email.split("@")
    if len(name) <= 2:
        masked = name[0] + "***"
    else:
        masked = name[0] + "***" + name[-1]
    return masked + "@" + domain


def user_forgot_password(request):

    request.session["account_type"] = "user"
    return common_forgot_password(request)

def guardian_forgot_password(request):

    request.session["account_type"] = "guardian"
    return common_forgot_password(request)

def common_forgot_password(request):

    step = request.session.get("reset_step", 1)
    account_type = request.session.get("account_type")

    # STEP 1 - EMAIL CHECK
    if request.method == "POST" and "email" in request.POST:

        email = request.POST.get("email")

        if account_type == "user":
            account = models.Register.objects.filter(email=email).first()
        else:
            account = models.guardian_register.objects.filter(email=email).first()

        if not account:
            messages.error(request, "Email not registered.")
            return redirect(request.path)

        request.session["account_id"] = account.id
        request.session["reset_step"] = 2

        return render(request, "forgot_password.html", {
            "step": 2,
            "masked_email": mask_email(account.email)
        })

    # STEP 2 - SEND OTP
    if request.method == "POST" and "send_otp" in request.POST:

        account_id = request.session.get("account_id")
        otp = str(random.randint(100000, 999999))

        if account_type == "user":
            account = models.Register.objects.get(id=account_id)
            models.PasswordResetOTP.objects.create(user=account, otp=otp)
        else:
            account = models.guardian_register.objects.get(id=account_id)
            models.PasswordResetOTP.objects.create(guardian=account, otp=otp)

        send_mail(
            "EyeTalk Password Reset OTP",
            f"Your OTP is {otp}. Valid for 10 minutes.",
            settings.EMAIL_HOST_USER,
            [account.email],
            fail_silently=True
        )

        request.session["reset_step"] = 3
        return render(request, "forgot_password.html", {"step": 3})

    # STEP 3 - VERIFY OTP
    if request.method == "POST" and "otp" in request.POST:

        account_id = request.session.get("account_id")
        entered_otp = request.POST.get("otp")

        if account_type == "user":
            account = models.Register.objects.get(id=account_id)
            otp_obj = models.PasswordResetOTP.objects.filter(user=account, otp=entered_otp).latest("created_at")
        else:
            account = models.guardian_register.objects.get(id=account_id)
            otp_obj = models.PasswordResetOTP.objects.filter(guardian=account, otp=entered_otp).latest("created_at")

        if otp_obj.is_expired():
            messages.error(request, "OTP expired.")
            return redirect(request.path)

        request.session["reset_step"] = 4
        return render(request, "forgot_password.html", {"step": 4})

    # STEP 4 - RESET PASSWORD
    if request.method == "POST" and "password" in request.POST:

        account_id = request.session.get("account_id")
        password = request.POST.get("password")
        confirm = request.POST.get("confirm_password")

        if password != confirm:
            messages.error(request, "Passwords do not match.")
            return redirect(request.path)

        if account_type == "user":
            account = models.Register.objects.get(id=account_id)
        else:
            account = models.guardian_register.objects.get(id=account_id)

        account.password = password
        account.confirm_password = password
        account.save()

        models.PasswordResetOTP.objects.filter(user=account if account_type=="user" else None,
                                        guardian=account if account_type=="guardian" else None).delete()

        request.session.flush()

        messages.success(request, "Password changed successfully.")
        return redirect("login")

    return render(request, "forgot_password.html", {"step": step})










def eye_keyboard(request):

    if 'user_email' not in request.session:
        return redirect('login')

    user = models.Register.objects.get(email=request.session['user_email'])

    return render(request,'eye_keyboard.html',{
        'user':user
    })
