from morsecode_reader_app import views
from django.urls import path


urlpatterns =[
    path('',views.index,name='index'),
    path('home/',views.home,name='home'),
    path('register/',views.register,name='register'),
    path('login/',views.login,name='login'),
    path('login_register/', views.login, name='login_register'),
    path('profile/',views.profile,name="profile"),
    path('logout/',views.logout,name="logout"),
    path('edit_profile/',views.edit_profile,name="edit_profile"),

    path('adminhome/',views.adminhome,name="adminhome"),
    path('admin_login/',views.admin_login,name="admin_login"),
    path('admin_logout/', views.admin_logout, name='admin_logout'),
    
    
    
    
    path('userlist/',views.userlist,name="userlist"),
    path('deleteuser/<int:id>/',views.deleteuser,name="deleteuser"),

    path('feedback/', views.feedbackpage, name='feedback'),


    path('guardian_register/',views.guardian_register,name='guardian_register'),
    path('guardian_login/',views.guardian_login,name='guardian_login'),
    path('guardian_log_reg/',views.guardian_login, name='guardian_log_reg'),
    path('guardian_home/',views.guardian_home,name='guardian_home'),
    path('guardian_dashboard/',views.guardian_dashboard,name='guardian_dashboard'),
    path('guardian_profile/',views.guardian_profile,name='guardian_profile'),
    path('guardian_edit_profile/',views.guardian_edit_profile,name='guardian_edit_profile'),
    path('grd_view_userlist/',views.grd_view_userlist,name="grd_view_userlist"),
    path('guardian_list/',views.guardian_list,name="guardian_list"),
    path('delete_guardian/<int:id>/',views.delete_grd,name="delete_grd"),
    path('approve_guardian/<int:id>/', views.approve_grd, name='approve_grd'),
    path('reject_guardian/<int:id>/', views.reject_grd, name='reject_grd'),


    path('guardian/disconnect/<int:req_id>/',views.admin_disconnect_user,name='admin_disconnect_user'),
    path('guardian/request-access/<int:user_id>/', views.request_user_access, name='request_user_access'),
    path('admin/guardian-list/',views.admin_guardian_list,name='admin_guardian_list'),
    path('verify-guardian-request/<int:request_id>/',views.admin_verify_guardian_request,name='admin_verify_guardian_request'),


    path('eyetalk_prog/', views.eyetalk_prog, name='eyetalk_prog'),
    path('eyetalk/save/', views.save_message, name='eyetalk_save'),


    path('user_dashboard/', views.user_dashboard, name='user_dashboard'),
    path('guardian/disconnect-user/<int:user_id>/', views.guardian_disconnect_user, name='guardian_disconnect_user'), 
    
    path('eyetalk_learning/', views.eyetalk_learning),
    path('learning_game/', views.learning_game),


    path('user_settings/', views.user_settings, name='user_settings'),

    path('api/save-settings/', views.save_settings),
    path('api/reset-settings/', views.reset_settings),
    path('api/get-settings/', views.get_settings),

    path('guardian/user-settings/<int:user_id>/', views.guardian_user_settings),
    path('guardian/api/get-settings/<int:user_id>/', views.guardian_get_user_settings),
    path('guardian/api/save-settings/<int:user_id>/', views.guardian_save_user_settings),

    path('guardian/user-messages/<int:user_id>/',views.guardian_view_user_messages,name='guardian_user_messages'),
    path('guardian/delete-message/<int:message_id>/', views.guardian_delete_message, name='guardian_delete_message'),

# urls.py

    path("api/blink/", views.api_blink),

    path("api/decode-morse/", views.api_decode_morse),

    path('trigger_sos/', views.trigger_sos, name='trigger_sos'),

    path('calibration/', views.calibration_page, name='calibration_page'),

    path('api/save-game-score/', views.save_game_score),


    
    
    
    path('user-forgot-password/', views.user_forgot_password, name='user_forgot_password'),
    path('guardian-forgot-password/', views.guardian_forgot_password, name='guardian_forgot_password'),


    path('eye_keyboard/', views.eye_keyboard, name='eye_keyboard'),


]

