var _lattitude = 0;
var _longitude = 0;
var set_lattitude = 0;
var set_longitude = 0;

var value_description ='';
var code_txt ='';
var issue_ch ='';
var image_upload='';
var redMarker;
var marker;
var issue_id;
var activate_user;
var activate_sms;
var activate_user_id;
var map=null ;
var count_step=0;
var _city;
var map1, map_plumbing,mapNeighbor;
var redMarker1,redMarker_plumbing,redMarker_neighbor;  
var marker1,marker_plumbing,marker_neighbor;
var my_markers,my_markers_plumbing,my_markers_neighbor;
var positionlat;
var positionlon; 
var device_uuid ='';
var mandatory_sms;
var mandatory_email;
var municipality;
var municipality_desc;
var allow_anonymous=false;
var active_sms_service;
var name_user='';
var email_user='';
var mobile_user='';
var language_user="";
var overview_obj='';

//provide database name and version number
var request;
var db;
var data_comment;
var mybug_comes=0;

var language_data = {
    "_gr":{
        "_garbage":"Καθαριότητα<span id=\"desc_garbage\">Επιλογή προβλήματος που αφορά την καθαριότητα.</span>",
        "_desc_garbage":"Επιλογή προβλήματος που αφορά την καθαριότητα.",
        "_light":"Ηλεκτροφωτισμός<span id=\"desc_lighting\">Επιλογή προβλήματος που αφορά τον Φωτισμό.</span>",
        "_desc_light":"Επιλογή προβλήματος που αφορά τον Φωτισμό.",
        "_road_construction":"Πεζοδρόμιο / Δρόμος / Πλατεία<span id=\"desc_road_construction\">Επιλογή προβλήματος που αφορά τo Πεζοδρόμιο/Οδόστρωμα.</span>",
        "_desc_road_construction":"Επιλογή προβλήματος που αφορά τo Πεζοδρόμιο/Οδόστρωμα.",
        "_protection_policy":"Πολιτική Προστασία<span id=\"desc_policy_protection\">Επιλογή προβλήματος που αφορά την Πολιτική Προστασία</span>",
        "_desc_protection_policy":"Επιλογή προβλήματος που αφορά την Πολιτική Προστασία",
        "_green":"Πράσινο<span id=\"desc_green\">Επιλογή προβλήματος που αφορά το Πράσινο</span>",
        "_desc_green":"Επιλογή προβλήματος που αφορά το Πράσινο.",
        "_environmental_issues":"Περιβαλλοντικά θέματα<span id=\"desc_enviroment\">Επιλογή προβλήματος που αφορά το Περιβάλλον</span>",
        "_desc_environmental_issues":"Επιλογή προβλήματος που αφορά το Περιβάλλον.",
        "_plumping":"Ύδρευση / Αποχέτευση<span id=\"desc_plumping\">Επιλογή προβλήματος που αφορά την Ύδρευση/Αποχέτευση.</span>",
        "_desc_plumping":"Επιλογή προβλήματος που αφορά την Ύδρευση/Αποχέτευση.",
        "_msg_society_fellings":"Εκφράστε την διάθεσή σας στην περιοχή που βρίσκεστε:",
        "_home_page":"<i class=\"glyphicon glyphicon-home button-icon-left\" data-position=\"left\"></i>Αρχική",
        "_my_issues":"<i class=\"glyphicon glyphicon-warning-sign button-icon-left\" data-position=\"left\"></i>Τα αιτήματα μου",
        "_about_us":"<i class=\"glyphicon glyphicon-info-sign button-icon-left\" data-position=\"left\"></i>Σχετικά",
        "_map":"<i class=\"glyphicon glyphicon-map-marker button-icon-left\" data-position=\"left\"></i>Χάρτης",
        "_policy":"<i class=\"fa fa-warning button-icon-left\" data-position=\"left\"></i>Πολιτική",
        "_send_report_sensecity":"<i class=\"glyphicon glyphicon-envelope button-icon-left\" data-position=\"left\"></i>Αναφορά προς SenseCity",
        "_report_msg1":"Αν θέλετε να αναφέρετε κάποιο πρόβλημα ή έχετε κάποια παρατήρηση για την εφαρμογή SenseCity συμπληρώστε την παρακάτω φόρμα και πατήστε «Αποστολή».",
        "_report_msg2":"Για την αποστολή της αναφοράς πρέπει να έχετε πιστοποιήσει το email σας! Η πιστοποίηση γίνεται πηγαίνοντας στην ενότητα \"Ρυθμίσεις\"",
        "_cancel_email":"Επιστροφή",
        "_send_mail":"Αποστολή",
        "_xalamenos":"Χαλασμένος Κάδος",
        "_ogkodis_antikeimena":"Ογκώδη αντικείμενα",
        "_komena_kladia":"Κομμένα Κλαδιά",
        "_mpaza":"Μπάζα",
        "_katharismos_plateias":"Καθαρισμός Πλατείας",
        "_mixanokiniti_sarosi":"Μηχανοκίνητη Σάρωση",
        "_allo_garbage":"Άλλο",
        "_garbage_msg":"Γράψτε το πρόβλημα",
        "_kamenos_lamptiras":"Καμμένος Λαμπτήρας",
        "_spasmenos_vraxionas":"Λαμπτήρας αναβοσβήνει",
        "_aneparkis_fotismos":"Επέκταση Δημοτικού Φωτισμού",
        "_topothetisi_fotismos":"Τοποθέτηση Φωτιστικού Σώματος",
        "_other_light":"Άλλο",
        "_lighting_msg":"Γράψτε το πρόβλημα",
        "_lakouva":"Λακούβα",
        "_katapatisi_koinoxriston_xoron":"Καταπατήσεις κοινόχρ. χώρων",
        "_spasmenes_plakes_pez":"Σπασμένες Πλάκες πεζοδρομίου",
        "_egkatalelimeno_autokinito":"Εγκαταλ. Αυτοκίνητο",
        "_katalipsi_pezodromiou":"Κατάληψη Πεζοδρομίου",
        "_spasmeno_pagkaki":"Σπασμένο Παγκάκι",
        "_kakotexnia":"Κακοτεχνία",
        "_other_road":"Άλλο",
        "_road_msg":"Γράψτε το πρόβλημα",
        "_protection_policy_theomynia":"Θεομηνία",
        "_protection_policy_clean_land":"Ακαθάριστο Οικόπεδο",
        "_protection_policy_allo":"Άλλο",
        "_protection_policy_other":"Γράψτε το πρόβλημα",
        "_green_kopi_xorton":"Κοπή Χόρτων",
        "_green_kladeuma_dentron":"Κλάδευμα Δέντρων",
        "_green_allo":"Άλλο",
        "_green_msg":"Γράψτε το πρόβλημα",
        "_adespoto_zoo":"Αδέσποτο Ζώο",
        "_anakyklwsi":"Ανακύκλωση",
        "_green_mioktonies":"Μυοκτονίες",
        "_green_entomoktonia":"Εντομοκτονία",
        "_allo_enviroment":"Άλλο",
        "_enviroment_issue":"Γράψτε το πρόβλημα",
        "_lbl_header_back":"Επιστροφή",
        "_cancel_email":"Επιστροφή",
        "_send_mail":"Αποστολή",
        "_popup_return":"<i class=\"el el-return-key button-icon-left\" data-position=\"left\"></i>Επιστροφή",
        "_epipleon_paratirisis":"Επιπλέον Παρατηρήσεις",
        "_plumbing_msg1":"Σχόλια",
        "_get_picture_plumbing":"<i class=\"glyphicon glyphicon-camera button-icon-left\" data-position=\"left\"></i> Λήψη Φωτογραφίας",
        "_file_plumbing_label":"Αλμπουμ …",
        "_anonymus_report":"Επώνυμη Αναφορά Προβλήματος",
        "_plumbing_policy_desc":"Πρόβλημα στο δίκτυο!",
        "_anonymus_popup_window_plumbing":"<span style=\"padding-left:20px; font-size:16px; position: relative; top: 7px; \">Επώνυμη αναφορά",
        "_collapse_info_panel":"Στοιχεία Πολίτη",
        "_plumbing_settings_name":"Ονοματεπώνυμο",
        "_plumbing_settings_email":"email",
        "_plumbing_settings_mobile":"Κινητό τηλέφωνο",
        "_ldl_email":"email",
        "_lbl_sms":"sms",
        "_change_user_info":"<i class=\"fa button-icon-left\" data-position=\"left\"></i>Επεξεργασία στοιχείων",
        "_send_plumbing":"<i class=\"fa fa-mail-forward button-icon-left\" data-position=\"left\"></i>Αποστολή στον Δήμο",
        "_plumbing_cancel":"<i class=\"glyphicon glyphicon-remove button-icon-top\" data-position=\"top\" style=\"padding-bottom:8px; \"></i>Ακύρωση",
        "_plumbing_back":"<i class=\"glyphicon glyphicon-chevron-left button-icon-top\" data-position=\"top\" style=\"padding-bottom:8px; \"></i>Πίσω",
        "_plumbing_next":"<i class=\"glyphicon glyphicon-chevron-right button-icon-top\" data-position=\"top\" style=\"padding-bottom:8px; \"></i>Επόμενο",
        "_clk_inprogress":"Ανοιχτό / Σε εξέλιξη",
        "_clk_resolved":"Ολοκληρωμένα",
        "_popup_return_new":"<i class=\"el el-return-key button-icon-left\" data-position=\"left\"></i>Επιστροφή",
        "_html_recom":"<h3>Μήπως εννοείται κάποιο από τα παρακάτω!</h3>",
        "_header_back":"Επιστροφή",
		"_modal_verify_user":"Πιστοποίηση",
		"_txt_popup_name":"Ονοματεπώνυμο",
		"_modal_verify_txt_msg":"Συμπληρώστε το email σας και πατήστε πιστοποίηση ώστε να λαμβάνετε ενημερώσεις για την κατάσταση των αιτημάτων σας στο email σας!",
		"_btn_verify_email":"<i class=\"fa fa-shield button-icon-left\" data-position=\"left\"></i>Πιστοποίηση",
		"_btn_verify_email_complete":"<i class=\"fa fa-check-circle-o button-icon-left\" data-position=\"left\" style=\"color:#2D882D;\"></i>Πιστοποίηση",
		"_modal_verify_txt_msg_mobile":"Συμπληρώστε το κινητό σας νούμερο και πατήστε πιστοποίηση ώστε να λαμβάνεται ενημερώσεις για την κατάσταση των αιτήματών σας με sms μηνύμα!",
		"_txt_mobile_number":"Κινητό",
		"_btn_verify_sms":"<i class=\"fa fa-shield button-icon-left\" data-position=\"left\"></i>Πιστοποίηση",
		"_btn_popup_close_verify":"Κλείσιμο",
		"_modal_email_certification_header":"Πιστοποίηση  email",
		"_msg_popup_verify_email_txt":"Λάθος κωδικός! Παρακαλώ πολύ ελέγξτε πάλι τον κωδικό πιστοποίησης!",
		"_btn_popup_final_verify":"<i class=\"fa fa-refresh  fa-spin fa-2x fa-fw button-icon-left\" data-position=\"left\"></i>Πιστοποίηση",
		"_msg_popup_verify_email_txt_1":"Εισάγετε τον κωδικό πιστοποίησης!",
		"_btn_send_plumbing":"<i class=\"fa fa-mail-forward button-icon-left\" data-position=\"left\"></i>Ανώνυμη Αποστολή",
		"_btn_popup_plumbing_verify_sms":"<i class=\"fa fa-refresh  fa-spin fa-2x fa-fw button-icon-left\" data-position=\"left\"></i>Πιστοποίηση",
		"_btn_popup_plumbing_verify_sms_shield":"<i class=\"fa fa-shield button-icon-left\" data-position=\"left\"></i>Πιστοποίηση",
		"_msg_popup_verify_mobile_txt":"Λάθος κωδικός! Παρακαλώ πολύ ελέγξτε πάλι τον κωδικό πιστοποίησης!",
		"_msg_popup_verify_mobile_txt_msg":"Εισάγετε τον κωδικό πιστοποίησης!",
		"_modal_info_title":"Πληροφορίες",
		"_popup_info_details":"Παρακαλώ επιλέξτε μια από τις παραπάνω τιμές!",
		"_modal_info_close_btn":"Κλείσιμο",
		"_modal_info_send_issue_title":"Πληροφορίες",
		"_popup_report":"Η αναφορά εστάλει με επιτυχία!",
		"_modal_info_send_issue_publish":"<strong>Δημοσίευση</strong>",
		"_btn_popup_return_new":"Επιστροφή",
		"_txt_send_mail_placeholder":"Θέμα",
		"_txtarea_send_mail_placeholder":"Πληροφορίες",
		"_js_var_write_comment":"Εισαγωγή σχολίου",
		"_js_var_register":"Εγγραφή",
		"_js_var_register_msg":"Πατήστε εγγραφή αν θέλετε να παρακολουθείτε αυτό το αίτημα!",
		"_js_var_citizen_comment":"Σχόλιο πολίτη :",
		"_js_var_no_result_found":"Δεν βρέθηκαν αποτελέσματα!",
		"_js_var_fill_fullname":"Για να προχωρίσετε την πιστοποίηση πρέπει συμπληρώσετε το πεδίο \"Ονοματεπώνυμο\"",
		"_js_var_fill_email":"Για να προχωρίσετε την πιστοποίηση πρέπει συμπληρώσετε το πεδίο \"email\"",
		"_msg_popup_verify_email_1":"Στο email ",
		"_msg_popup_verify_email_2":" που δηλώσατε σας έχει έρθει ο κωδικός πιστοποίησης! Σε περίπτωση που θέλετε να αλλάξετε το email σας κλείστε το παράθυρο και ξεκινήστε την διαδικασία από την αρχή!",
		"_msg_popup_verify_email_3":"Tο email ",
		"_msg_popup_verify_email_4":" που δηλώσατε έχει πιστοποιηθεί!",
		"_msg_fill_mobile_number":"Πρέπει να συμπληρώσετε το πεδίο Κινητό τηλέφωνο!",
		"_msg_fill_email":"Πρέπει να συμπληρώσετε το πεδίο email!",
		"_msg_fill_mobile_certification":"Δεν έχετε ενεργοποιήση το νούμερο του κινητού σας!",
		"_msg_fill_email_certification":"Δεν έχετε ενεργοποιήση το email σας!",
		"_msg_no_internet":"<div>Δεν υπάρχει διαθέσιμο Internet.</div>",
		"_msg_no_gps":"<div>Δεν είναι ενεργοποιημένο GPS!</div>",
		"_msg_register_to_issue":"<i class=\"fa fa-mail-forward button-icon-left\" data-position=\"left\"></i>Εγγραφή στο αίτημα!",
		"_send_plumbing_loading":"<i class=\"fa fa-refresh  fa-spin fa-2x fa-fw button-icon-left\" data-position=\"left\"></i>Αποστολή στον Δήμο",
		"_msg_info_succed_submition":"Το αίτημα σας καταχωρίθηκε με επιτυχία!",
		"_msg_info_avaliable_issue":"<div>Πρέπει να επιλέξετε ένα από τα διαθέσιμα προβλήματα!</div>",
		"_msg_info_register_in_a_issue_1":"Η εγγραφή στο αίτημα ",
		"_msg_info_register_in_a_issue_2":" μπορεί να πραγματοποιηθεί μόνο αν έχετε επιλέξει Επώνυμη Αναφορά! Αν θέλετε να επιλέξετε την Επώνυμη Αναφορά πηγαίνεται ένα βήμα πίσω και επαναλάβεται την διαδικασία!",
		"_msg_info_social_1":" Μόλις πρόσθεσα ένα πρόβλημα στην πόλη μου ",
		"_msg_info_social_2":"Επικολήστε το κείμενο!",
		"_msg_info_sent_email_1":"<p>To email στάλθηκε με επιτυχία!</p>",
		"_msg_info_sent_email_2":"<p>To email δεν στάλθηκε.</p>",
		"_msg_info_register_1":"Δεν μπορείτε να εγγραφτείτε στο αίτημα #",
		"_msg_info_register_2":" ως ανώνυμος!",
		"_msg_info_register_3":"Θα πρέπει να πιστοποιήσετε το email & το κινητό σας νούμερο για να ολοκληρώσετε με επιτυχία την Αποστολή αιτήματος!",
		"_msg_info_register_4":"Θα πρέπει να πιστοποιήσετε το email σας για να ολοκληρώσετε με επιτυχία την Αποστολή αιτήματος!",
		"_msg_info_register_5":"Θα πρέπει να πιστοποιήσετε το κινητό σας νούμερο για να ολοκληρώσετε με επιτυχία την Αποστολή αιτήματος!",
		"_msg_info_register_6":"Αποστολή στον Δήμο",
		"_msg_category":"Κατηγορία",
		"_msg_issue":"Αίτημα",
		"_msg_comment":"Σχόλια",
		"_msg_next_1":"<i class=\"fa fa-refresh  fa-spin fa-2x fa-fw  button-icon-top\" data-position=\"top\"></i>Επόμενο",
		"_plumping_issue_1":"Βουλωμένο Φρεάτιο",
		"_plumping_issue_2":"Σπασμένο Καπάκι Φρεατίου",
		"_plumping_issue_3":"Διαρροή Νερού",
		"_plumping_issue_4":"Άλλο",
		"_plumping_issue_5":"Γράψτε το πρόβλημα",
		"_msg_overview_title":"<h4>Αποστολή Νέου Αιτήματος!</h4>",
		"_lbl_header_title":"Γλώσσα",
		"_lbl_btn_en":"<img src=\"img/if_United-Kingdom_298478.png\" style=\"width:30px;\"> &nbsp;English",
		"_lbl_btn_gr":"<img src=\"img/if_Grecee_298418.png\" style=\"width:30px;\"> &nbsp;Ελληνικά",
		"_btn_setting":"<i class=\"glyphicon glyphicon-cog button-icon-left\" data-position=\"left\"></i>Ρυθμίσεις"
    },
    "_en":{
        "_garbage":"Street cleaning<span id=\"desc_garbage\">Options regarding Street cleaning issues.</span>",
        "_desc_garbage":"Options regarding Street cleaning issues.",
        "_light":"Lighting<span id=\"desc_lighting\">Options regarding lighting issues.</span>",
        "_desc_light":"Options regarding lighting issues.",
        "_road_construction":"Pavement / Road / Square<span id=\"desc_road_construction\">Options regarding Pavement / Road / Square issues.</span>",
        "_desc_road_construction":"Options regarding Pavement / Road / Square issues.",
        "_protection_policy":"Civil Protection<span id=\"desc_policy_protection\">Options regarding Civil Protection issues</span>",
        "_desc_protection_policy":"Options regarding Civil Protection issues",
        "_green":"Parks and landscapes<span id=\"desc_green\">Options regarding Parks and landscapes issues.</span>",
        "_desc_green":"Options regarding Parks and landscapes issues.",
        "_environmental_issues":"Environmental issue<span id=\"desc_enviroment\">Options regarding Environmental issues.</span>",
        "_desc_environmental_issues":"Options regarding Environmental issues.",
        "_plumping":"Water system/drain<span id=\"desc_plumping\">Options regarding Water system/drain issues.</span>",
        "_desc_plumping":"Options regarding Water system/drain issues.",
        "_msg_society_fellings":"How do you feel in this area?",
        "_home_page":"<i class=\"glyphicon glyphicon-home button-icon-left\" data-position=\"left\"></i>Home",
        "_my_issues":"<i class=\"glyphicon glyphicon-warning-sign button-icon-left\" data-position=\"left\"></i>My issue",
        "_about_us":"<i class=\"glyphicon glyphicon-info-sign button-icon-left\" data-position=\"left\"></i>About",
        "_map":"<i class=\"glyphicon glyphicon-map-marker button-icon-left\" data-position=\"left\"></i>Map",
        "_policy":"<i class=\"fa fa-warning button-icon-left\" data-position=\"left\"></i>Policy",
        "_send_report_sensecity":"<i class=\"glyphicon glyphicon-envelope button-icon-left\" data-position=\"left\"></i>Send your feedback",
        "_report_msg1":"If you would like to report a problem or you have a comment about the SenseCity application, fill out the contact form below and click \"Send\"",
        "_report_msg2":"To send a report you must have your email verified! The certification is performed by going to \"Settings\"",
        "_cancel_email":"Back",
        "_send_mail":"Send",
        "_xalamenos":"Damaged Bin",
        "_ogkodis_antikeimena":"Huge Objects",
        "_komena_kladia":"Tree Branches",
        "_mpaza":"Debris",
        "_katharismos_plateias":"Street Cleaning",
        "_mixanokiniti_sarosi":"Motorized Scanning",
        "_allo_garbage":"Other",
        "_garbage_msg":"Report your issue",
        "_kamenos_lamptiras":"Problematic Lamp post",
        "_spasmenos_vraxionas":"Broken Lamp post",
        "_aneparkis_fotismos":"Limited Lighting",
        "_topothetisi_fotismos":"Request for Lighting",
        "_other_light":"Other",
        "_lighting_msg":"Report your issue",
        "_lakouva":"Pothole",
        "_katapatisi_koinoxriston_xoron":"Infringement public area",
        "_spasmenes_plakes_pez":"Broken Pavement",
        "_egkatalelimeno_autokinito":"Abandoned Car",
        "_katalipsi_pezodromiou":"Pavement parkers",
        "_spasmeno_pagkaki":"Broken Bench",
        "_kakotexnia":"Botchery",
        "_other_road":"Other",
        "_road_msg":"Report your issue",
        "_protection_policy_theomynia":"Natural disaster",
        "_protection_policy_clean_land":"Problematic area",
        "_protection_policy_allo":"Other",
        "_protection_policy_other":"Report your issue",
        "_green_kopi_xorton":"Grass Cutting",
        "_green_kladeuma_dentron":"Tree Trimming",
        "_green_allo":"Other",
        "_green_msg":"Report your issue",
        "_adespoto_zoo":"Stray animal",
        "_anakyklwsi":"Recycling",
        "_green_mioktonies":"Rodent extermination",
        "_green_entomoktonia":"Insect extermination",
        "_allo_enviroment":"Other",
        "_enviroment_issue":"Report your issue",
        "_lbl_header_back":"Back",
        "_cancel_email":"Back",
        "_send_mail":"Send",
        "_popup_return":"<i class=\"el el-return-key button-icon-left\" data-position=\"left\"></i>Back",
        "_epipleon_paratirisis":"More Comments",
        "_plumbing_msg1":"Comment",
        "_get_picture_plumbing":"<i class=\"glyphicon glyphicon-camera button-icon-left\" data-position=\"left\"></i> Take photo",
        "_file_plumbing_label":"Album … ",
        "_anonymus_report":"Verified Report issue",
        "_plumbing_policy_desc":"Network error!",
        "_anonymus_popup_window_plumbing":"Verified Report",
        "_collapse_info_panel":"Citizen Details",
        "_plumbing_settings_name":"Full Name",
        "_plumbing_settings_email":"email",
        "_plumbing_settings_mobile":"Mobile Number",
        "_ldl_email":"email",
        "_lbl_sms":"sms",
        "_change_user_info":"<i class=\"fa button-icon-left\" data-position=\"left\"></i>Edit",
        "_send_plumbing":"<i class=\"fa fa-mail-forward button-icon-left\" data-position=\"left\"></i>Send",
        "_plumbing_cancel":"<i class=\"glyphicon glyphicon-remove button-icon-top\" data-position=\"top\" style=\"padding-bottom:8px; \"></i>Cancel",
        "_plumbing_back":"<i class=\"glyphicon glyphicon-chevron-left button-icon-top\" data-position=\"top\" style=\"padding-bottom:8px; \"></i>Back",
        "_plumbing_next":"<i class=\"glyphicon glyphicon-chevron-right button-icon-top\" data-position=\"top\" style=\"padding-bottom:8px; \"></i>Next",
        "_clk_inprogress":"Confirmed / In Progress",
        "_clk_resolved":"Fixed",
        "_popup_return_new":"<i class=\"el el-return-key button-icon-left\" data-position=\"left\"></i>Back",
        "_html_recom":"<h3>Is it any of the following?</h3>",
        "_header_back":"Back",
		"_modal_verify_user":"Authentication",
		"_txt_popup_name":"Full Name",
		"_modal_verify_txt_msg":"Fill out your email and press the button Authenticate to get information for the progress of your issue in your email!",
		"_btn_verify_email":"<i class=\"fa fa-shield button-icon-left\" data-position=\"left\"></i>Authenticate",
		"_btn_verify_email_complete":"<i class=\"fa fa-check-circle-o button-icon-left\" data-position=\"left\" style=\"color:#2D882D;\"></i>Authenticate",
		"_modal_verify_txt_msg_mobile":"Fill out your mobile number and press the button Authenticate to get information for the progress of your issue in your mobile via sms messages!",
		"_txt_mobile_number":"Mobile Number",
		"_btn_verify_sms":"<i class=\"fa fa-shield button-icon-left\" data-position=\"left\"></i>Authenticate",
		"_btn_popup_close_verify":"Close",
		"_modal_email_certification_header":"Email Verification",
		"_msg_popup_verify_email_txt":"Incorrect Password! Please check your verification code again!",
		"_btn_popup_final_verify":"<i class=\"fa fa-refresh  fa-spin fa-2x fa-fw button-icon-left\" data-position=\"left\"></i>Authenticate",
		"_msg_popup_verify_email_txt_1":"Enter your verification code!",
		"_btn_send_plumbing":"<i class=\"fa fa-mail-forward button-icon-left\" data-position=\"left\"></i>Send it as Anonymous",
		"_btn_popup_plumbing_verify_sms":"<i class=\"fa fa-refresh  fa-spin fa-2x fa-fw button-icon-left\" data-position=\"left\"></i>Authenticate",
		"_btn_popup_plumbing_verify_sms_shield":"<i class=\"fa fa-shield button-icon-left\" data-position=\"left\"></i>Authenticate",
		"_msg_popup_verify_mobile_txt":"Incorrect Password! Please check your verification code again!",
		"_msg_popup_verify_mobile_txt_msg":"Enter your verification code!",
		"_modal_info_title":"Information",
		"_popup_info_details":"Please select one value!",
		"_modal_info_close_btn":"Close",
		"_modal_info_send_issue_title":"Information",
		"_popup_report":"The report was sent successfully!",
		"_modal_info_send_issue_publish":"<strong>Post</strong>",
		"_btn_popup_return_new":"Back",
		"_txt_send_mail_placeholder":"Subject",
		"_txtarea_send_mail_placeholder":"Information",
		"_js_var_write_comment":"Add a comment",
		"_js_var_register":"Register",
		"_js_var_register_msg":"Register if you want to be notified about this issue!",
		"_js_var_citizen_comment":"Citizen comment :",
		"_js_var_no_result_found":"No results found!",
		"_js_var_fill_fullname":"To proceed the verification you must fill out the \"Full name\" field",
		"_js_var_fill_email":"To proceed the verification you must fill out the \"email\" field",
		"_msg_popup_verify_email_1":"In your email ",
		"_msg_popup_verify_email_2":" you have received the verification code! If you want to change your email please close the window and try again!",
		"_msg_popup_verify_email_3":"The email ",
		"_msg_popup_verify_email_4":" was certified!",
		"_msg_fill_mobile_number":"You must fill out the field Mobile Number!",
		"_msg_fill_email":"You must fill out the field email!",
		"_msg_fill_mobile_certification":"You haven't verified successfully your mobile number!",		
		"_msg_fill_email_certification":"You haven't verified successfully your email!",
		"_msg_no_internet":"<div>There is no Internet connection.</div>",
		"_msg_no_gps":"<div>Your GPS is inactive!</div>",
		"_msg_register_to_issue":"<i class=\"fa fa-mail-forward button-icon-left\" data-position=\"left\"></i>Register!",
		"_send_plumbing_loading":"<i class=\"fa fa-refresh  fa-spin fa-2x fa-fw button-icon-left\" data-position=\"left\"></i>Send",
		"_msg_info_succed_submition":"Your report has been submitted successfully!",
		"_msg_info_avaliable_issue":"<div>Select any of the available issues!</div>",
		"_msg_info_register_in_a_issue_1":"The issue ",
		"_msg_info_register_in_a_issue_2":" will be submitted only if you are a verified user! If you want to do be a verified user please repeat the previous step!",
		"_msg_info_social_1":" I have just reported an issue for my city ",
		"_msg_info_social_2":"Paste the message!",
		"_msg_info_sent_email_1":"<p>The e-mail was sent successfully!</p>",
		"_msg_info_sent_email_2":"<p>The e-mail was not sent.</p>",
		"_msg_info_register_1":"You can't register at issue #",
		"_msg_info_register_2":" as unverified user!",
		"_msg_info_register_3":"You must verify your email & mobile number to complete successfully the submission!",
		"_msg_info_register_4":"You must verify your email to complete successfully the submission!",
		"_msg_info_register_5":"You must verify your mobile number to complete successfully the submission!",
		"_msg_info_register_6":"Send",
		"_msg_category":"Category",
		"_msg_issue":"Issue",
		"_msg_comment":"Comments",
		"_msg_next_1":"<i class=\"fa fa-refresh  fa-spin fa-2x fa-fw  button-icon-top\" data-position=\"top\"></i>Next",
		"_plumping_issue_1":"Blocked small Well",
		"_plumping_issue_2":"Broken cap of a small Well",
		"_plumping_issue_3":"Water Leakage",
		"_plumping_issue_4":"Other",
		"_plumping_issue_5":"Report an issue",
		"_msg_overview_title":"<h4>Submit a new issue!</h4>",
		"_lbl_header_title":"Language",
		"_lbl_btn_en":"<img src=\"img/if_United-Kingdom_298478.png\" style=\"width:30px;\"> &nbsp;English",
		"_lbl_btn_gr":"<img src=\"img/if_Grecee_298418.png\" style=\"width:30px;\"> &nbsp;Ελληνικά",
		"_btn_setting":"<i class=\"glyphicon glyphicon-cog button-icon-left\" data-position=\"left\"></i>Settings"
    }
};

var language_code;



function createIndexeddb(){
	request = window.indexedDB.open("db_sensecity", 1);
	db = null;
	
	request.onupgradeneeded = function(){			
			db = request.result;
		
			//create object store and define key property of the objects on that store i.e., primary index. Here "ID" is the key  
			var store = db.createObjectStore("tbl_sensecity", {keyPath: "ID", autoIncrement: false});

			//define other properties of the objects of that store i.e., define other columns.
			store.createIndex("name", "name", {unique: false});
			store.createIndex("email", "email", {unique: true});
			store.createIndex("mobile_phone", "mobile_phone", {unique: false});
			store.createIndex("language", "language", {unique: false});
		}		
		
		request.onsuccess = function(){
			//database connection established 
			db = request.result;
			
			selectIndexeddb();
		}

		request.onerror = function(){
			console.log("An error occured while connecting to database");
		}
}


function selectIndexeddb(){
	var read_transition = db.transaction("tbl_sensecity", "readonly");
	var store = read_transition.objectStore("tbl_sensecity");
	var row = store.get("1");
		
	row.onsuccess = function(evt){
		if(row.result!=undefined){
			name_user = row.result.name;
			email_user = row.result.email;
			mobile_user = row.result.mobile_phone;
			language_user = row.result.language;
			language_code = "_"+row.result.language;
			
		}
	}
}

function updateIndexedDB(uname, uemail, umobile, ulanguage){
	
		var object1 = {ID:"1", name: uname,email: uemail, mobile_phone: umobile, language: ulanguage};
		var write_transition = db.transaction("tbl_sensecity", "readwrite");
		var store = write_transition.objectStore("tbl_sensecity");
		store.put(object1);
		
		name_user = uname;
		email_user = uemail;
		mobile_user = umobile;
		language_user = ulanguage;
		language_code = "_"+ulanguage;
}

createIndexeddb();

//var APIURL="https://apitest.sense.city:4443/api/1.0"; 
var APIURL="http://localhost:3000/api/1.0"; 
//var APIURL="http://apitest.sense.city:4000/api/1.0"; 
//var APIURL="http://api.sense.city:3000/api/1.0";

// Create database And initial

var my_bug_id = '';
var bug_alias = '';

var city_reported='';

function get_recom(my_bug_id,bug_alias,mybug_comes,city_reported){
	
	var html_details='';
	var _department = "";
	var _comments='';

	var us__mail=email_user;
	var us__mobile=mobile_user;

	var department_split;
	var position_dep;

	var button_submit_add_comment=language_data[language_code]._js_var_write_comment;//"Εισαγωγή σχολίου";
	var msg_register='';
	
	if(mybug_comes==1){
		button_submit_add_comment=language_data[language_code]._js_var_register; //"Εγγραφή";
		msg_register=language_data[language_code]._js_var_register_msg; //'Πατήστε εγγραφή αν θέλετε να παρακολουθείτε αυτό το αίτημα!';	
	}

	//modal_waiting_page
	$("#modal_waiting_page").modal("toggle");

	$.ajax({
		crossDomain: true,
		type:"GET",
		url: APIURL+"/fullissue/"+bug_alias,
		contentType: "application/json; charset=utf-8",                                				
		success: function(msg){	
			console.log("msg=>"+JSON.stringify(msg));
			if(msg[0]!=undefined){
				
				_city = msg[0].municipality;
				issue_id = msg[0].bug_id;
				value_description = msg[0].value_desc;

				overview_obj=msg;
				$.ajax({
					crossDomain: true,
					type:"GET",
					url: "https://"+msg[0].municipality+".sense.city/config/"+msg[0].municipality+".json",
					contentType: "application/json; charset=utf-8",                                				
					success: function(json_data){	

						var _status ="";
						if(msg[0].status=="CONFIRMED"){
							_status="ΑΝΟΙΚΤΟ";
						}else if(msg[0].status=="IN_PROGRESS"){
							_status="ΣΕ ΕΞΕΛΙΞΗ";
						}else if(msg[0].status=="RESOLVED"){
							_status="ΔΙΕΚΠΑΙΡΕΩΜΕΝΟ";
						}
						var url_img = APIURL+'/image_issue?bug_id='+my_bug_id+'&resolution=small';

						$.ajax({
							crossDomain: true,
							type:"GET",
							url: APIURL+"/image_issue?bug_id="+my_bug_id+"&resolution=small",
							contentType: "application/json; charset=utf-8",                                				
							success: function(msg1){										
								html_details += '<div style="padding:5px;width:100%;"><table style="width: 100%;"><tr>';
								html_details += '<td width="30%"><img src="'+url_img+'" height="50px;" /></td>';
								html_details += '<td width="70%">';
								html_details += '<div><i class="glyphicon glyphicon-calendar"></i> '+new Date(msg[0].create_at).getUTCDate()+'/'+(new Date(msg[0].create_at).getUTCMonth()+1)+'/'+new 	Date(msg[0].create_at).getFullYear()+'('+_status+')</div>';
								html_details += '</div><b>'+city_reported+'</b></div><div>'+msg[0].city_address+'</div>';
								html_details += '</td>';
								html_details += '</tr>';
								html_details += '</table></div>';							
								html_details += '<section id="cd-timeline">';

								for(var j=1;j<msg[0].bugs[my_bug_id].comments.length;j++)
								{
									if(msg[0].bugs[my_bug_id].comments[j].tags[0].indexOf("DEPARTMENT:") != -1){

										var xxx = msg[0].bugs[my_bug_id].comments[j].tags[0];
										var _depart = xxx;

										_department = _depart.split(':');

										for(var t=0;t<json_data.components_en.length;t++){
											if(json_data.components_en[t]==_department[1]){
												position_dep=t;
											}

											if(position_dep != 'undefined'){										
												department_split = json_data.components[position_dep];
											}
										}												

									}else{
										department_split = "Σχόλιο πολίτη :";
									}

									if(msg[0].bugs[my_bug_id].comments[j].text!='undefined'){
										_comments = msg[0].bugs[my_bug_id].comments[j].text;
									}

									if(j==1){		
										html_details += '<div class="cd-timeline-block"><div class="cd-timeline-img"><i style="font-size:48px; color:#db494f;" class="glyphicon glyphicon-exclamation-sign"></i></div> <div class="cd-timeline-content"><h2>'+new Date(msg[0].bugs[my_bug_id].comments[j].creation_time).getUTCDate()+'/'+(new Date(msg[0].bugs[my_bug_id].comments[j].creation_time).getUTCMonth()+1)+'/'+new Date(msg[0].bugs[my_bug_id].comments[j].creation_time).getFullYear()+'</h2><p style="font-size:14px;">'+department_split+'<br />'+_comments+'</p></div></div>';
									}else{
										html_details += '<div class="cd-timeline-block"><div class="cd-timeline-img"><i style="font-size:48px; color:#e46a28;" class="glyphicon glyphicon-question-sign"></i></div><div class="cd-timeline-content"><h2>'+new Date(msg[0].bugs[my_bug_id].comments[j].creation_time).getUTCDate()+'/'+(new Date(msg[0].bugs[my_bug_id].comments[j].creation_time).getUTCMonth()+1)+'/'+new Date(msg[0].bugs[my_bug_id].comments[j].creation_time).getFullYear()+'</h2><p style="font-size:14px;">'+department_split+'<br />'+_comments+'</p></div></div><div class="cd-timeline-block"></div>';
									}		 	
								}
								html_details += '</section>';
								html_details += '<div style="padding:5px; width:100%; font-size:10px;"><table style="width: 100%;"><tr><td width="100%"><textarea placeholder="'+language_data[language_code]._js_var_write_comment+'" style="width:100%" id="txt_msg_'+my_bug_id+'" ></textarea>	</td></tr></table></div>';
								html_details += '<div style="padding:5px;"><table><tr>';
								html_details += '<td colspan="2"><p style="text-align:justify;"><b>'+msg_register+'</b></p></td>';
								html_details += '<td width="70%"></td>';

								if(mybug_comes==1){
									html_details += '<td ><button class="btn widget uib_w_147 d-margins btn-lg btn-info" data-uib="twitter%20bootstrap/button" data-ver="1" onclick="btn_get_register_details('+my_bug_id+',\''+us__mail+'\',\''+us__mobile+'\',\''+mybug_comes+'\')">'+button_submit_add_comment+'</button>';
								}else{
									html_details += '<td ><button class="btn widget uib_w_147 d-margins btn-lg btn-info" data-uib="twitter%20bootstrap/button" data-ver="1" onclick="btn_add_comment('+my_bug_id+',\''+us__mail+'\',\''+us__mobile+'\',\''+mybug_comes+'\',\''+bug_alias+'\')">'+button_submit_add_comment+'</button>';
								}

								html_details += '</td>';
								html_details += '</tr>';
								html_details += '</table></div>';

								$("#my_bugdiv_"+my_bug_id).html(html_details);
								if(mybug_comes==1){										
									$("#txt_msg_"+my_bug_id).css("display", "none");
								}

								$("#modal_waiting_page").modal("toggle");

								$("#my_img"+my_bug_id).attr('src',encodeURI(msg1));
							},
							error:function(){

								html_details += '<div style="padding:5px;width:100%;"><table style="width: 100%;"><tr>';
								html_details += '<td width="30%"><img src="/images/EmptyBox-Phone.png" height="50px;" /></td>';
								html_details += '<td width="70%">';
								html_details += '<div><i class="glyphicon glyphicon-calendar"></i> '+new Date(msg[0].create_at).getUTCDate()+'/'+(new Date(msg[0].create_at).getUTCMonth()+1)+'/'+new 	Date(msg[0].create_at).getFullYear()+'('+_status+')</div>';
								html_details += '</div><b>'+city_reported+'</b></div><div>'+msg[0].city_address+'</div>';
								html_details += '</td>';
								html_details += '</tr>';
								html_details += '</table></div>';
								html_details += '<section id="cd-timeline">';
								for(var j=1;j<msg[0].bugs[my_bug_id].comments.length;j++)
								{
									if(msg[0].bugs[my_bug_id].comments[j].tags[0].indexOf("DEPARTMENT:") != -1){

										var xxx = msg[0].bugs[my_bug_id].comments[j].tags[0];
										var _depart = xxx;

										_department = _depart.split(':');

										for(var t=0;t<json_data.components_en.length;t++){
											if(json_data.components_en[t]==_department[1]){
												position_dep=t;
											}

											if(position_dep != 'undefined'){										
												department_split = json_data.components[position_dep];
											}
										}												

									}else{
										department_split = language_data[language_code]._js_var_citizen_comment;//"Σχόλιο πολίτη :";
									}

									if(msg[0].bugs[my_bug_id].comments[j].text!='undefined'){
										_comments = msg[0].bugs[my_bug_id].comments[j].text;
									}

									if(j==1){
										html_details += '<div class="cd-timeline-block"><div class="cd-timeline-img"><i style="font-size:48px; color:#db494f;" class="glyphicon glyphicon-exclamation-sign"></i></div> <div class="cd-timeline-content"><h2>'+new Date(msg[0].bugs[my_bug_id].comments[j].creation_time).getUTCDate()+'/'+(new Date(msg[0].bugs[my_bug_id].comments[j].creation_time).getUTCMonth()+1)+'/'+new Date(msg[0].bugs[my_bug_id].comments[j].creation_time).getFullYear()+'</h2><p style="font-size:14px;">'+department_split+'<br />'+_comments+'</p></div></div>';
									}else{									
										html_details += '<div class="cd-timeline-block"><div class="cd-timeline-img"><i style="font-size:48px; color:#e46a28;" class="glyphicon glyphicon-question-sign"></i></div><div class="cd-timeline-content"><h2>'+new Date(msg[0].bugs[my_bug_id].comments[j].creation_time).getUTCDate()+'/'+(new Date(msg[0].bugs[my_bug_id].comments[j].creation_time).getUTCMonth()+1)+'/'+new Date(msg[0].bugs[my_bug_id].comments[j].creation_time).getFullYear()+'</h2><p style="font-size:14px;">'+department_split+'<br />'+_comments+'</p></div></div><div class="cd-timeline-block"></div>';
									}		 	
								}

								html_details += '</section>';
								html_details += '<div style="padding:5px;width:100%; font-size:10px;"><table style="width: 100%;"><tr><td width="100%"><textarea placeholder="' + language_data[language_code]._js_var_write_comment + '" style="width:100%" id="txt_msg_'+my_bug_id+'" ></textarea>	</td></tr></table></div>';
								html_details += '<div style="padding:5px;"><table style="width:100%"><tr>';
								html_details += '<td colspan="2"><p style="text-align:justify;"><b>'+msg_register+'</b></p></td></tr><tr>';
								html_details += '<td width="70%"></td>';

								if(mybug_comes==1){
									html_details += '<td ><button class="btn widget uib_w_147 d-margins btn-lg btn-info" data-uib="twitter%20bootstrap/button" data-ver="1" onclick="btn_get_register_details('+my_bug_id+',\''+us__mail+'\',\''+us__mobile+'\',\''+mybug_comes+'\')">'+button_submit_add_comment+'</button>';
								}else{
									html_details += '<td ><button class="btn widget uib_w_147 d-margins btn-lg btn-info" data-uib="twitter%20bootstrap/button" data-ver="1" onclick="btn_add_comment('+my_bug_id+',\''+us__mail+'\',\''+us__mobile+'\',\''+mybug_comes+'\',\''+bug_alias+'\')">'+button_submit_add_comment+'</button>';
								}
								html_details += '</td>';
								html_details += '</tr>';
								html_details += '</table></div>';

								$("#my_bugdiv_"+my_bug_id).html(html_details);

								if(mybug_comes==1){										
									$("#txt_msg_"+my_bug_id).css("display", "none");
								}

								$("#modal_waiting_page").modal("toggle");
							}
						});
					}
				});	 
			}else{
				$("#modal_waiting_page").modal("toggle");
				$("#my_bugdiv_"+my_bug_id).html(language_data[language_code]._js_var_no_result_found);
			}
		}
	});
}

var _us_email;
var _us_mobile;


function btn_get_register_details(bug_id, _us_email,_us_mobile,mybug_comes){
	
	data_comment = '{"bug_id":"'+bug_id+'","email":"'+_us_email+'","mobile_num":"'+_us_mobile+'" ,"comment":"'+$("#txt_plumbing_msg1").val().replace(/\s+/g, ' ').trim()+'"}';	
	
	mybug_comes=1;
	
	issue_step(5);
	count_step++;
}


function btn_add_comment(bug_id, _us_email,_us_mobile,mybug_comes,_alias){
		$("#modal_waiting_page").modal("toggle");
		if($("#txt_msg_"+bug_id).val()!=''){			
			data_comment = '{"bug_id":"'+bug_id+'","email":"'+_us_email+'","mobile_num":"'+_us_mobile+'" ,"comment":"'+$("#txt_msg_"+bug_id).val().replace(/\s+/g, ' ').trim()+'"}';
			
			$.ajax({
				crossDomain: true,
				url: APIURL+"/issue_subscribe",
				contentType: "application/json; charset=utf-8",                                								
                type:"POST",                                
                dataType: "json",               
                data:data_comment, 
				success: function(msg1){						
					if(mybug_comes==1){
						clear_fields();
						activate_subpage("#page_78_74");
					}	
					$("#modal_waiting_page").modal("toggle");
					get_recom(bug_id,_alias,mybug_comes,"");
				},
				error:function(){
					if(mybug_comes==1){
						activate_subpage("#page_78_74");
					}					
					get_recom(bug_id,_alias,mybug_comes,"");
					$("#modal_waiting_page").modal("toggle");
				}
			});
			
		}else{
			alert("empty");
		}	
	}

var current_step=0;

function issue_step(current_step){
	
	switch(current_step){
		case 0:
			$("#step_plumbing_1").css("display", "block");
            $("#step_plumbing_2").css("display", "none");
            $("#step_plumbing_3").css("display", "none");
            $("#step_plumbing_4").css("display", "none");
			$("#step_plumbing_4_5").css("display", "none");
            $("#step_plumbing_5").css("display", "none");
			$("#step_plumbing_6").css("display", "none");
            $("#btn_plumbing_back").prop("disabled", true);
            $("#btn_plumbing_next").prop("disabled", false);
			break;
		case 1:
			$("#step_plumbing_1").css("display", "none");
            $("#step_plumbing_2").css("display", "block");
            $("#step_plumbing_3").css("display", "none");
            $("#step_plumbing_4").css("display", "none");
			$("#step_plumbing_4_5").css("display", "none");
            $("#step_plumbing_5").css("display", "none");
			$("#step_plumbing_6").css("display", "none");
            $("#btn_plumbing_back").prop("disabled", false);
            $("#btn_plumbing_next").prop("disabled", false);
			break;
		case 2:
			$("#step_plumbing_1").css("display", "none");
            $("#step_plumbing_2").css("display", "none");
            $("#step_plumbing_3").css("display", "block");
            $("#step_plumbing_4").css("display", "none");
			$("#step_plumbing_4_5").css("display", "none");
            $("#step_plumbing_5").css("display", "none");
			$("#step_plumbing_6").css("display", "none");
            $("#btn_plumbing_back").prop("disabled", false);
            $("#btn_plumbing_next").prop("disabled", false);
			break;
		case 3:
			$("#step_plumbing_1").css("display", "none");
            $("#step_plumbing_2").css("display", "none");
            $("#step_plumbing_3").css("display", "none");
            $("#step_plumbing_4").css("display", "block");
			$("#step_plumbing_4_5").css("display", "none");
            $("#step_plumbing_5").css("display", "none");
			$("#step_plumbing_6").css("display", "none");
            $("#btn_plumbing_back").prop("disabled", false);
            $("#btn_plumbing_next").prop("disabled", false);
			break;
		case 4:
			$("#step_plumbing_1").css("display", "none");
            $("#step_plumbing_2").css("display", "none");
            $("#step_plumbing_3").css("display", "none");
            $("#step_plumbing_4").css("display", "none");
			$("#step_plumbing_4_5").css("display", "block");
            $("#step_plumbing_5").css("display", "none");
			$("#step_plumbing_6").css("display", "none");
            $("#btn_plumbing_back").prop("disabled", false);
            $("#btn_plumbing_next").prop("disabled", false);
			break;
		case 5:			
			$("#step_plumbing_1").css("display", "none");
            $("#step_plumbing_2").css("display", "none");
            $("#step_plumbing_3").css("display", "none");
            $("#step_plumbing_4").css("display", "none");
			$("#step_plumbing_4_5").css("display", "none");
            $("#step_plumbing_5").css("display", "block");
			$("#step_plumbing_6").css("display", "none");
            $("#btn_plumbing_back").prop("disabled", false);
            $("#btn_plumbing_next").prop("disabled", false);
			break;
		case 6:
			$("#step_plumbing_1").css("display", "none");
            $("#step_plumbing_2").css("display", "none");
            $("#step_plumbing_3").css("display", "none");
            $("#step_plumbing_4").css("display", "none");
			$("#step_plumbing_4_5").css("display", "none");
            $("#step_plumbing_5").css("display", "none");
			$("#step_plumbing_6").css("display", "block");
            $("#btn_plumbing_back").prop("disabled", false);
            $("#btn_plumbing_next").prop("disabled", true);
			break;
		default:
			$("#step_plumbing_1").css("display", "block");
            $("#step_plumbing_2").css("display", "none");
            $("#step_plumbing_3").css("display", "none");
            $("#step_plumbing_4").css("display", "none");
			$("#step_plumbing_4_5").css("display", "none");
            $("#step_plumbing_5").css("display", "none");
			$("#step_plumbing_6").css("display", "none");
            $("#btn_plumbing_back").prop("disabled", true);
            $("#btn_plumbing_next").prop("disabled", false);
			break;	
	}
		
}

function makeid()
    {
        code_txt='';
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz";

        for( var i=0; i < 15; i++ )
            code_txt += possible.charAt(Math.floor(Math.random() * possible.length));

        //return code_txt;
        
    }
if(code_txt===null || code_txt===''){
    makeid();
}

/*jshint browser:true */
/*global $ */(function()
{
 "use strict";
 /*
   hook up event handlers 
 */
	
 function register_event_handlers()
 {     	 
    $("#btn_popup_save").css("display","none");
    $("#verify_msg_popup").css("display","none");
    
    $("#txt_pop_up_activate_code").css("display","none");
    $('#setting_popup_alert').css("display","none");
	 
     $(document).on("click", "#allo_garbage", function(evt)
     {
        if($("#allo_garbage").prop("checked",true)){
            $("#txt_garbage_msg").show();
        }        
     });
    
	 
     $(document).on("click", "#xalamenos", function(evt)
     {
        $("#txt_garbage_msg").hide();
     });
    
     $(document).on("click", "#ogkodis_antikeimena", function(evt)
     {
        $("#txt_garbage_msg").hide();
     });
    
     $(document).on("click", "#komena_kladia", function(evt)
     {
        $("#txt_garbage_msg").hide();
     });
    
    
     $(document).on("click", "#mpaza", function(evt)
     {
        $("#txt_garbage_msg").hide();
     });
    
     $(document).on("click", "#katharismos_plateias", function(evt)
     {
        $("#txt_garbage_msg").hide();
     });
    
     $(document).on("click", "#mixanokiniti_sarosi", function(evt)
     {
        $("#txt_garbage_msg").hide();
     });
     
     
     $(document).on("click", "#btn_garbage", function(evt)
     {		
        clear_fields();	
        issue_ch = "garbage";	 		 
		$("#container_issues").html("<fieldset class=\"widget uib_w_14 d-margins\" data-uib=\"twitter%20bootstrap/radio_group\" data-ver=\"1\" data-child-name=\"bs-radio-group-0\">"+
                                    "<label class=\"radio radio-padding-left widget uib_w_15 label_radio_btn_line_height\" data-uib=\"twitter%20bootstrap/radio_button\" data-ver=\"1\">"+
                                        "<input type=\"radio\" name=\"bs-radio-group-0\" onclick=\"clear_txt()\" id=\"xalamenos\" value=\""+language_data[language_code]._xalamenos+"\"><span style=\"padding-left:20px; font-size:12px; position: relative; top: 7px; \">"+language_data[language_code]._xalamenos+"</span>"+
                                    "</label>"+
                                    "<label class=\"radio radio-padding-left widget uib_w_15 label_radio_btn_line_height\" data-uib=\"twitter%20bootstrap/radio_button\" data-ver=\"1\">"+
                                        "<input type=\"radio\" name=\"bs-radio-group-0\" onclick=\"clear_txt()\" id=\"ogkodis_antikeimena\" value=\""+language_data[language_code]._ogkodis_antikeimena+"\"><span style=\"padding-left:20px; font-size:12px; position: relative; top: 7px; \">"+language_data[language_code]._ogkodis_antikeimena+"</span>"+
                                    "</label>"+
                                    "<label class=\"radio radio-padding-left widget uib_w_16 label_radio_btn_line_height\" data-uib=\"twitter%20bootstrap/radio_button\" data-ver=\"1\">"+
                                        "<input type=\"radio\" name=\"bs-radio-group-0\" onclick=\"clear_txt()\" id=\"komena_kladia\" value=\""+language_data[language_code]._komena_kladia+"\"><span style=\"padding-left:20px; font-size:12px; position: relative; top: 7px;\">"+language_data[language_code]._komena_kladia+"</span>"+
                                    "</label>"+
                                    "<label class=\"radio radio-padding-left widget uib_w_17 label_radio_btn_line_height\" data-uib=\"twitter%20bootstrap/radio_button\" data-ver=\"1\">"+
                                        "<input type=\"radio\" name=\"bs-radio-group-0\" onclick=\"clear_txt()\" id=\"mpaza\" value=\""+language_data[language_code]._mpaza+"\"><span style=\"padding-left:20px; font-size:12px; position: relative; top: 7px;\">"+language_data[language_code]._mpaza+"</span>"+
                                    "</label>"+
                                    "<label class=\"radio radio-padding-left widget uib_w_17 label_radio_btn_line_height\" data-uib=\"twitter%20bootstrap/radio_button\" data-ver=\"1\">"+
                                        "<input type=\"radio\" name=\"bs-radio-group-0\" onclick=\"clear_txt()\" id=\"katharismos_plateias\" value=\""+language_data[language_code]._katharismos_plateias+"\"><span style=\"padding-left:20px; font-size:12px; position: relative; top: 7px;\">"+language_data[language_code]._katharismos_plateias+"</span>"+
                                    "</label>"+
                                    "<label class=\"radio radio-padding-left widget uib_w_17 label_radio_btn_line_height\" data-uib=\"twitter%20bootstrap/radio_button\" data-ver=\"1\">"+
                                        "<input type=\"radio\" name=\"bs-radio-group-0\" onclick=\"clear_txt()\" id=\"mixanokiniti_sarosi\" value=\""+language_data[language_code]._mixanokiniti_sarosi+"\"><span style=\"padding-left:20px; font-size:12px; position: relative; top: 7px;\">"+language_data[language_code]._mixanokiniti_sarosi+"</span>"+
                                    "</label>"+
                                    "<label class=\"radio radio-padding-left widget uib_w_17 label_radio_btn_line_height\" data-uib=\"twitter%20bootstrap/radio_button\" data-ver=\"1\">"+
                                        "<input type=\"radio\" name=\"bs-radio-group-0\" onclick=\"focus_txt()\" id=\"allo_garbage\"><span style=\"padding-left:20px; font-size:12px; position: relative; top: 7px;\">"+language_data[language_code]._allo_garbage+"</span>"+
                                    "</label>"+
                                    "<div class=\"table-thing widget uib_w_18 d-margins\" data-uib=\"twitter%20bootstrap/input\" data-ver=\"1\">"+
                                        "<label class=\"narrow-control\" for=\"txt_garbage_msg\"></label>"+
                                        "<input class=\"wide-control form-control default input-lg\" type=\"text\" placeholder=\""+language_data[language_code]._garbage_msg+"\" id=\"txt_garbage_msg\" onclick=\"enable_txt()\">"+
                                    "</div>"+
                                "</fieldset>"+
                                "<span class=\"uib_shim\"></span><script>$(\"#txt_garbage_msg\").hide(); </script>");
	 
		 activate_page("#uib_page_test");
		 
		
		 
		/*if(email_user==undefined || mobile_user==undefined){
			modal_verification();
		 	$("#popup_verify").modal("toggle");	
		}*/
		 
     });
    
     $(document).on("click", "#rdio_other_light", function(evt)
     {
        if($("#rdio_other_light").prop("checked",true)){
            $("#txt_lighting_msg").show();
        }        
     });
    
     $(document).on("click", "#kamenos_lamptiras", function(evt)
     {
        $("#txt_lighting_msg").hide();
     });
    
     $(document).on("click", "#spasmenos_vraxionas", function(evt)
     {
        $("#txt_lighting_msg").hide();
     });
    
     $(document).on("click", "#aneparkis_fotismos", function(evt)
     {
        $("#txt_lighting_msg").hide();
     });
    
    
     $(document).on("click", "#topothetisi_fotismos", function(evt)
     {
        $("#txt_lighting_msg").hide();
     });
    
     /* button  #btn_light */
     $(document).on("click", "#btn_light", function(evt)
     {
        clear_fields();
		 
		issue_ch="lighting";
		$("#container_issues").html(' <fieldset class="widget uib_w_19 d-margins" data-uib="twitter%20bootstrap/radio_group" data-ver="1" data-child-name="bs-radio-group-1">'+
                                    '<label class="radio radio-padding-left widget uib_w_20 label_radio_btn_line_height" data-uib="twitter%20bootstrap/radio_button" data-ver="1">'+
                                        '<input type="radio" name="bs-radio-group-1" onclick="clear_txt_light()" id="kamenos_lamptiras" value="'+language_data[language_code]._kamenos_lamptiras+'"><span style="padding-left:20px; font-size:12px; position: relative; top: 7px;">'+language_data[language_code]._kamenos_lamptiras+'</span>'+
                                    '</label>'+
                                    '<label class="radio radio-padding-left widget uib_w_21 label_radio_btn_line_height" data-uib="twitter%20bootstrap/radio_button" data-ver="1">'+
                                        '<input type="radio" name="bs-radio-group-1" onclick="clear_txt_light()" id="spasmenos_vraxionas" value="'+language_data[language_code]._spasmenos_vraxionas+'"><span style="padding-left:20px; font-size:12px; position: relative; top: 7px;">'+language_data[language_code]._spasmenos_vraxionas+'</span>'+
                                    '</label>'+
                                    '<label class="radio radio-padding-left widget uib_w_22 label_radio_btn_line_height" data-uib="twitter%20bootstrap/radio_button" data-ver="1">'+
                                        '<input type="radio" name="bs-radio-group-1" onclick="clear_txt_light()" id="aneparkis_fotismos" value="'+language_data[language_code]._aneparkis_fotismos+'"><span style="padding-left:20px; font-size:12px; position: relative; top: 7px;">'+language_data[language_code]._aneparkis_fotismos+'</span>'+
                                    '</label>'+
                                    '<label class="radio radio-padding-left widget uib_w_22 label_radio_btn_line_height" data-uib="twitter%20bootstrap/radio_button" data-ver="1">'+
                                        '<input type="radio" name="bs-radio-group-1" onclick="clear_txt_light()" id="topothetisi_fotismos" value="'+language_data[language_code]._topothetisi_fotismos+'"><span style="padding-left:20px; font-size:12px; position: relative; top: 7px;">'+language_data[language_code]._topothetisi_fotismos+'</span>'+
                                    '</label>'+
                                    '<label class="radio radio-padding-left widget uib_w_22 label_radio_btn_line_height" data-uib="twitter%20bootstrap/radio_button" data-ver="1">'+
                                        '<input type="radio" name="bs-radio-group-1" id="rdio_other_light" onclick="focus_txt_light()"><span style="padding-left:20px; font-size:12px; position: relative; top: 7px;">'+language_data[language_code]._other_light+'</span>'+
                                    '</label>'+
                                '</fieldset>'+
                                '<span class="uib_shim"></span>'+
                                '<div class="table-thing widget uib_w_33 d-margins" data-uib="twitter%20bootstrap/input" data-ver="1">'+
                                    '<label class="narrow-control"></label>'+
                                    '<input class="wide-control form-control default" type="text" placeholder="'+language_data[language_code]._lighting_msg+'" id="txt_lighting_msg" onclick="enable_txt_lighting()">'+
                                '</div><script>$("#txt_lighting_msg").hide(); </script>');
         
		activate_page("#uib_page_test");
    });	 
	 
    $(document).on("click","#btn_verify_email",function(evt){		
		
		if($("#txt_popup_name").val()==''){
			$("#popup_info").modal('show');
			$("#popup_info_details").html(language_data[language_code]._js_var_fill_fullname);
		}else if($("#txt_email_verify_popup").val()==''){
			$("#popup_info").modal('show');
			$("#popup_info_details").html(language_data[language_code]._js_var_fill_email);
		}
		else{
			var _name_user;
			var _email_user;
			var _mobile_user;
			
			if(name_user!=''){
				_name_user = name_user;
				$("#txt_popup_name").val(_name_user);
			}else{
				_name_user=$("#txt_popup_name").val();
			}
			
			if(email_user!=''){
				_email_user = email_user;
			}else{
				_email_user = "";
			}
			
			if(mobile_user!=''){
				_mobile_user=mobile_user;
			}else{
				_mobile_user="";
			}
			
			var data_email = '{"uuid":"web-site","email":"'+$("#txt_email_verify_popup").val()+'","name":"'+_name_user+'","city":"'+municipality+'" }';
			$("#modal_waiting_page").modal("toggle");	
			$.ajax({
				crossDomain: true,
				type:"POST",
				url: APIURL+"/is_activate_user",
				dataType:"json",
				contentType: "application/json; charset=utf-8",
				data: data_email,
				success: function(msg){ 						
						$.ajax({
							crossDomain: true,
							type:"POST",
							url: APIURL+"/activate_user?uuid=web-site&email="+$("#txt_email_verify_popup").val(),
							dataType:"json",
							success: function(msg1){		
								
								updateIndexedDB(_name_user,"", mobile_user, language_user);
																
								$("#popup_pumbing_email_verify").modal("toggle");
								$("#msg_popup_verify_email").html(language_data[language_code]._msg_popup_verify_email_1 + $("#txt_email_verify_popup").val() + language_data[language_code]._msg_popup_verify_email_2);
								$("#txt_popup_plumbing_verify_code_email").css("display","block");
								$("#modal_waiting_page").modal("toggle");
							}
						});
					//}
				},
				error:function(err1){					
					$("#modal_waiting_page").modal("toggle");
				}
			 });
		}
	});
	
	 
	$(document).on("click","#btn_verify_sms",function(evt){
		
		if($("#txt_popup_name").val()==''){
			$("#popup_info").modal('show');
			$("#popup_info_details").html(language_data[language_code]._js_var_fill_fullname);
		}else if($("#txt_mobile_number").val()==''){
			$("#popup_info").modal('show');
			$("#popup_info_details").html(language_data[language_code]._js_var_fill_email);
		}
		else{
			var _name_user;
			var _email_user;
			var _mobile_user;
			
			if(name_user!=''){
				_name_user = name_user;
				$("#txt_popup_name").val(_name_user);
			}else{
				_name_user=$("#txt_popup_name").val();
			}
			
			if(email_user!=''){
				_email_user = email_user;
			}else{
				_email_user = "";
			}
			
			if(mobile_user!=''){
				_mobile_user=mobile_user;
			}else{
				_mobile_user="";
			}
			
			var data_email = '{"uuid":"web-site","mobile":"'+$("#txt_mobile_number").val()+'","name":"'+$("#txt_popup_name").val()+'","city":"'+municipality+'","email":"" }';
		
			$.ajax({
				crossDomain: true,
				type:"POST",
				url: APIURL+"/is_activate_user",
				dataType:"json",
				contentType: "application/json; charset=utf-8",
				data: data_email,
				success: function(msg){ 	
					if(msg[0].activate_email=="1"){
						$("#popup_pumbing_sms_verify").modal("toggle");
						$("#msg_popup_verify_sms").html("<i class=\"glyphicon glyphicon-ok\" style=\"font-size:24px; color:green;\"></i>"+language_data[language_code]._msg_popup_verify_email_3+ $("#txt_mobile_number").val() + language_data[language_code]._msg_popup_verify_email_4);
						$("#txt_popup_plumbing_verify_sms_code").css("display","none");

						updateIndexedDB(name_user, email_user, $("#txt_mobile_number").val(), language_user);

					}else{
						
						$.ajax({
							crossDomain: true,
							type:"POST",
							url: APIURL+"/activate_user?uuid=web-site&mobile="+$("#txt_mobile_number").val()+"&lat="+_lattitude+"&long="+_longitude,
							dataType:"json",
							success: function(msg1){											
								updateIndexedDB(name_user, email_user, "",language_user);
								$("#popup_pumbing_sms_verify").modal("toggle");
								$("#msg_popup_verify_sms").html(language_data[language_code]._msg_popup_verify_email_1 + $("#txt_mobile_number").val() + language_data[language_code]._msg_popup_verify_email_2);
								$("#txt_popup_plumbing_verify_sms_code").css("display","block");
							}
						});


					}
				}

			 });
		}
	});
	 
	 
	$(document).on("click","#btn_popup_close_verify",function(evt){		
		
		//uib_sb.toggle_sidebar($(".uib_w_39"));
		
		 uib_sb.close_all_sidebars();
	
		if(mandatory_email=="true" && mandatory_sms=="true"){					
			if(email_user=='' || mobile_user==''){
				$("#chk_anonymus_popup_window_plumbing").checked =false;
			}
		}else if(mandatory_email=="true" && mandatory_sms=="false"){
			if(email_user==''){
				$("#chk_anonymus_popup_window_plumbing").checked =false;
			}
		}else if(mandatory_email=="false" && mandatory_sms=="true"){
			if(mobile_user==''){
				$("#chk_anonymus_popup_window_plumbing").checked =false;
			}
		}
		
		
		
		
		if($('#chk_anonymus_popup_window_plumbing').is(':checked')){   		
			
			if(name_user != ''){				
					$("#txt_plumbing_settings_name").val(name_user);
				}
			else{
				$("#txt_plumbing_settings_name").val("");
			}

				if(email_user != ''){
					$("#txt_plumbing_settings_email").val(email_user);
				}else{
					$("#txt_plumbing_settings_email").val("");
				}
				
				if(mobile_user != ''){
					$("#txt_plumbing_settings_mobile").val(mobile_user);
				}else{
					$("#txt_plumbing_settings_mobile").val("");
				}						

			updateIndexedDB($("#txt_popup_name").val(),email_user,mobile_user,language_user);
			$("#txt_plumbing_settings_name").val($("#txt_popup_name").val());
			
			$('#txt_popup_name').val('');
			$('#txt_email_verify_popup').val('');
			$('#txt_mobile_number').val('');
			
			$('#msg_verify_sms').css("display", "block");
			$('#txt_mobile_number').css("display", "block");			
			$('#btn_verify_sms').css("display", "block");
			 
            enable_issue_form();
			$("#txt_plumbing_settings_name").prop("disabled", true);
			$("#txt_plumbing_settings_email").prop("disabled",true);
			$("#txt_plumbing_settings_mobile").prop("disabled",true);
			
         }else{   
           $("#btn_send_plumbing").html('<i class="fa fa-mail-forward button-icon-left" data-position="left"></i>Ανώνυμη Αποστολή');
            $("#btn_send_plumbing").css("display","block");
            
            $("#txt_plumbing_settings_name").val('');
            $("#txt_plumbing_settings_email").val('');
            $("#txt_plumbing_settings_mobile").val('');
            $('#chk_email')[0].checked =false;
            $("#chk_sms")[0].checked = false;
             
            disable_issue_form();    
        }
		
		
		
		
		
	});
	 
	 
    $(document).on("click", "#chk_anonymus_popup_window_plumbing", function(evt){ 
		
		selectIndexeddb();
		$("#chk_email").prop("disabled", true);
		$("#chk_sms").prop("disabled", true);
			
		
		
		if($('#chk_anonymus_popup_window_plumbing').is(':checked')){ $("#bs-accordion-group-0").collapse('show');} else { $("#bs-accordion-group-0").collapse('hide'); }
		
        if($('#chk_anonymus_popup_window_plumbing').is(':checked')){   		
			
			$('#msg_verify_sms').css("display", "block");
			$('#txt_mobile_number').css("display", "block");
			$('#btn_verify_sms').css("display", "block");
			 
            enable_issue_form();
			$("#txt_plumbing_settings_name").prop("disabled", true);
			$("#txt_plumbing_settings_email").prop("disabled",true);
			$("#txt_plumbing_settings_mobile").prop("disabled",true);
 			
			$.ajax({
                crossDomain: true,
                type:"POST",
                url: APIURL+"/activate_city_policy?lat=" + set_lattitude + "&long=" + set_longitude,
                dataType: "json",                				
                success: function(msg){	
					
					mandatory_sms = msg[0].mandatory_sms;
					mandatory_email = msg[0].mandatory_email;
					
					if(mandatory_email=="true"){						
						$("#chk_email")[0].checked=true;
					}else{
						$("#chk_email")[0].checked=false;						
					}
					
					if(mandatory_sms=="true"){
						$("#chk_sms")[0].checked=true;
					}else{
						$("#chk_sms")[0].checked=false;
					}
					
					municipality = msg[0].municipality;
					municipality_desc = msg[0].municipality_desc;
					active_sms_service = msg[0].active_sms_service;
			}
			});
			
			if(name_user=='' && (email_user=='' || mobile_user=='')){
				
				$("#popup_verify").modal("toggle");	
				$("#txt_popup_name").val(name_user);
				$("#txt_email_verify_popup").val(email_user);
				$("#txt_mobile_number").val(mobile_user);
			}else{
				
				if(name_user != ''){				
					$("#txt_plumbing_settings_name").val(name_user.toString());
				}

				if(email_user != ''){
					$("#txt_plumbing_settings_email").val(email_user.toString());
				}
				
				if(mobile_user != ''){
					$("#txt_plumbing_settings_mobile").val(mobile_user.toString());
				}

			}
         }else{   
           $("#btn_send_plumbing").html('<i class="fa fa-mail-forward button-icon-left" data-position="left"></i>Ανώνυμη Αποστολή');
            $("#btn_send_plumbing").css("display","block");
            
            $("#txt_plumbing_settings_name").val('');
            $("#txt_plumbing_settings_email").val('');
            $("#txt_plumbing_settings_mobile").val('');
            if(mandatory_email=="true"){						
				$("#chk_email")[0].checked=true;
			}else{
				$("#chk_email")[0].checked=false;						
			}
				
			if(mandatory_sms=="true"){
				$("#chk_sms")[0].checked=true;
			}else{
				$("#chk_sms")[0].checked=false;
			}
             
            disable_issue_form();    
        }
     });
     
     
    $(document).on("click", "#rdio_other_plumbing", function(evt)
    {
        if($("#rdio_other_plumbing").prop("checked",true)){
            $("#txt_plumbing_msg").show();
        }        
    });
    
    $(document).on("click", "#voulomeno_freatio", function(evt)
    {
        $("#txt_plumbing_msg").hide();
    });
    
    $(document).on("click", "#spasmeno_freatio", function(evt)
    {
        $("#txt_plumbing_msg").hide();
    });
    
    $(document).on("click", "#diaroi_nerou", function(evt)
    {
        $("#txt_plumbing_msg").hide();
    });
    
     
    /* button  #btn_send_plumbing */
    $(document).on("click", "#btn_send_plumbing", function(evt)
    {		
		var _mobile_num = '';
		var _email = '';
		
		if(mandatory_sms ===true && $("#txt_plumbing_settings_mobile").val() === ''){
			$("#popup_info").modal("toggle");
			$("#popup_info_details").html(language_data[language_code]._msg_fill_mobile_number);
			return false;
		}
		
		if(mandatory_email ===true && $("#txt_plumbing_settings_email").val()===''){
			$("#popup_info").modal("toggle");
			$("#popup_info_details").html(language_data[language_code]._msg_fill_email);
			return false;
		}
		
		if(mandatory_sms ===true && mandatory_email ===false ){
			if(activate_sms!=="1"){
				$("#popup_info").modal("toggle");
				$("#popup_info_details").html(language_data[language_code]._msg_fill_mobile_certification);
				return false;
			}
		}else if(mandatory_sms ===false && mandatory_email ===true ){
			if(activate_user!=="1"){
				$("#popup_info").modal("toggle");
				$("#popup_info_details").html(language_data[language_code]._msg_fill_email_certification);
				return false;
			}
		}else if(mandatory_sms ===false && mandatory_email ===false ){
			if(activate_user!=="1"){
				$("#popup_info").modal("toggle");
				$("#popup_info_details").html(language_data[language_code]._msg_fill_email_certification);
				return false;
			}else if(activate_sms!=="1"){
				$("#popup_info").modal("toggle");
				$("#popup_info_details").html(language_data[language_code]._msg_fill_mobile_certification);
				return false;
			}
		}else if(mandatory_sms ===true && mandatory_email ===true ){
			if(activate_user!=="1"){
				$("#popup_info").modal("toggle");
				$("#popup_info_details").html(language_data[language_code]._msg_fill_email_certification);
				return false;
			}
			
			if(activate_sms!=="1"){
				$("#popup_info").modal("toggle");
				$("#popup_info_details").html(language_data[language_code]._msg_fill_mobile_certification);
				return false;
			}
		}
				
        $("#btn_send_plumbing").prop("disabled", true);
        
        if(!checkConnection())
        {
            $(".modal-body").html(language_data[language_code]._msg_no_internet);
                $(".uib_w_67").modal("toggle");
                return false;
        }
        
        if(_longitude === 0 || _lattitude === 0 || _longitude===null || _lattitude===null){
                $(".modal-body").html(language_data[language_code]._msg_no_gps);
                $(".uib_w_67").modal("toggle");
                return false;
        }
        
		if($("#txt_plumbing_settings_mobile").val() !== ''){
			_mobile_num = $("#txt_plumbing_settings_mobile").val();
		
		}
		
		if($("#txt_plumbing_settings_email").val() !== ''){
			_email = $("#txt_plumbing_settings_email").val();	
		}
		
		if(data_comment==''){
			 if(value_description !==''){
				 if(mybug_comes==1){
					$("#btn_send_plumbing").html(language_data[language_code]._msg_register_to_issue);
				}else{
					$("#btn_send_plumbing").html(language_data[language_code]._send_plumbing_loading);
				}
				
				var _lng;
				var _lat;
				if(set_lattitude!==0 && set_longitude!==0){
					_lng = set_longitude;
					_lat = set_lattitude;
				}else{
					_lng = _longitude;
					_lat = _lattitude;

				}
				
				//url: APIURL+"/save_image",
				$.ajax({
					type: "POST",
					url: APIURL+"/issue",
					data: '{"loc" : { "type" : "Point",  "coordinates" : ['+_lng+','+_lat+'] }, "issue" : "'+issue_ch+'","device_id" : "' + code_txt + '", "value_desc" : "' + value_description + '", "comments" : "' + $("#txt_plumbing_msg1").val() + '","image_name" : "'+image_upload+'","mobile_num":"'+_mobile_num+'","email_user":"'+_email+'" }',
					contentType: "application/json; charset=utf-8",
					dataType: "json",
					success: function(data){
						
						console.log('{"loc" : { "type" : "Point",  "coordinates" : ['+_lng+','+_lat+'] }, "issue" : "'+issue_ch+'","device_id" : "' + code_txt + '", "value_desc" : "' + value_description + '", "comments" : "' + $("#txt_plumbing_msg1").val() + '","image_name" : "'+image_upload+'","mobile_num":"'+_mobile_num+'","email_user":"'+_email+'" }');
						issue_id=data._id;
						if($('#chk_anonymus_popup_window_plumbing').is(':checked')){
							// Insert/Update active user
								 var jsonData = '{ "uuid" : "'+device_uuid+'", "name": "'+$("#txt_plumbing_settings_name").val()+'", "email": "'+$("#txt_plumbing_settings_email").val()+'", "mobile_num": "'+$("#txt_plumbing_settings_mobile").val()+'"}';							
								$.ajax({
									crossDomain: true,
									type:"POST",
									url: APIURL+"/issue/"+data._id,
									contentType: "application/json; charset=utf-8",
									dataType: "json",               
									data:jsonData,
									success: function(msg){							
										$("#popup_report").text(language_data[language_code]._msg_info_succed_submition);
										$("#social_media_new").modal("toggle");
										if(mybug_comes==1){
											$("#btn_send_plumbing").html(language_data[language_code]._msg_register_to_issue);
										}else{
											$("#btn_send_plumbing").html(language_data[language_code]._send_plumbing);
										}
											
									}
								});
							}
						else{
							activate_subpage("#page_78_74"); 
						}

					},
					failure: function(errMsg) {
						$(".uib_w_79").modal("toggle"); 
					}
				});
			}
			else{
				$("#modal-body_id").html(language_data[language_code]._msg_info_avaliable_issue);
				$("#error_popup").modal("toggle");
				return false;
			}
		}
		else{
			
			if($("#chk_anonymus_popup_window_plumbing").is(':checked')){
				$("#modal_waiting_page").modal("toggle");
				var bug__id = JSON.parse(data_comment).bug_id;
				data_comment = '{"bug_id":"'+bug__id+'","email":"'+email_user+'","mobile_num":"'+mobile_user+'" ,"comment":"'+$("#txt_plumbing_msg1").val().replace(/\s+/g, ' ').trim()+'"}';
				console.log("data_comment"+data_comment);
				$.ajax({
					crossDomain: true,
					url: APIURL+"/issue_subscribe",
					contentType: "application/json; charset=utf-8",                                								
					type:"POST",                                
					dataType: "json",               
					data:data_comment, 
					success: function(msg1){
						if(mybug_comes==1){
							clear_fields();
							activate_subpage("#page_78_74");
						}	
						$("#modal_waiting_page").modal("toggle");
						$("#social_media_new").modal("toggle");
					},
					error:function(){
						if(mybug_comes==1){
							activate_subpage("#page_78_74");
						}
						
						$("#modal_waiting_page").modal("toggle");
						$("#social_media_new").modal("toggle");
					}
				});
				
				
			}else{
				
				$("#popup_info_details").html("<div>" + language_data[language_code]._msg_info_register_in_a_issue_1 + JSON.parse(data_comment).bug_id + language_data[language_code]._msg_info_register_in_a_issue_2 + "</div>");
				$("#popup_info").modal("toggle");
			}
		}        
    });
    
    $(document).on("click", "#rdio_other_road", function(evt)
    {
        if($("#rdio_other_road").prop("checked",true)){
            $("#txt_road_msg").show();
        }        
    });
    
    $(document).on("click", "#lakouva", function(evt)
    {
        $("#txt_road_msg").hide();
    });
    
    $(document).on("click", "#katapatisi_koinoxriston_xoron", function(evt)
    {
        $("#txt_road_msg").hide();
    });
    
    $(document).on("click", "#spasmenes_plakes_pez", function(evt)
    {
        $("#txt_road_msg").hide();
    });
    
    $(document).on("click", "#egkatalelimeno_autokinito", function(evt)
    {
        $("#txt_road_msg").hide();
    });
    
    $(document).on("click", "#katalipsi_pezodromiou", function(evt)
    {
        $("#txt_road_msg").hide();
    });
    
    $(document).on("click", "#spasmeno_pagkaki", function(evt)
    {
        $("#txt_road_msg").hide();
    });
    
    $(document).on("click", "#kakotexnia", function(evt)
    {
        $("#txt_road_msg").hide();
    });
   
     
    $(document).on("click", "#btn_road_construction", function(evt)
    {
        clear_fields();		
		
		issue_ch="road-constructor";
		$("#container_issues").html(' <fieldset class="widget uib_w_24 d-margins" data-uib="twitter%20bootstrap/radio_group" data-ver="1" data-child-name="bs-radio-group-2">'+
                                    '<label class="radio radio-padding-left widget uib_w_25 label_radio_btn_line_height" data-uib="twitter%20bootstrap/radio_button" data-ver="1">'+
                                        '<input type="radio" name="bs-radio-group-2" onclick="clear_txt_road()" id="lakouva" value="'+language_data[language_code]._lakouva+'"><span style="padding-left:20px; font-size:12px; position: relative; top: 7px;">'+language_data[language_code]._lakouva+'</span>'+
                                    '</label>'+
                                    '<label class="radio radio-padding-left widget uib_w_15 label_radio_btn_line_height" data-uib="twitter%20bootstrap/radio_button" data-ver="1">'+
                                        '<input type="radio" name="bs-radio-group-0" onclick="clear_txt()" id="katapatisi_koinoxriston_xoron" value="'+language_data[language_code]._katapatisi_koinoxriston_xoron+'"><span style="padding-left:20px; font-size:12px; position: relative; top: 7px; ">'+language_data[language_code]._katapatisi_koinoxriston_xoron+'</span>'+
                                    '</label>'+
                                    '<label class="radio radio-padding-left widget uib_w_26 label_radio_btn_line_height" data-uib="twitter%20bootstrap/radio_button" data-ver="1">'+
                                        '<input type="radio" name="bs-radio-group-2" onclick="clear_txt_road()" id="spasmenes_plakes_pez" value="'+language_data[language_code]._spasmenes_plakes_pez+'"><span style="padding-left:20px; font-size:12px; position: relative; top: 7px;">'+language_data[language_code]._spasmenes_plakes_pez+'</span>'+
                                    '</label>'+
                                    '<label class="radio radio-padding-left widget uib_w_26 label_radio_btn_line_height" data-uib="twitter%20bootstrap/radio_button" data-ver="1">'+
                                        '<input type="radio" name="bs-radio-group-2" onclick="clear_txt_road()" id="egkatalelimeno_autokinito" value="'+language_data[language_code]._egkatalelimeno_autokinito+'"><span style="padding-left:20px; font-size:12px; position: relative; top: 7px;">'+language_data[language_code]._egkatalelimeno_autokinito+'</span>'+
                                    '</label>'+
                                    '<label class="radio radio-padding-left widget uib_w_26 label_radio_btn_line_height" data-uib="twitter%20bootstrap/radio_button" data-ver="1">'+
                                        '<input type="radio" name="bs-radio-group-2" onclick="clear_txt_road()" id="katalipsi_pezodromiou" value="'+language_data[language_code]._katalipsi_pezodromiou+'"><span style="padding-left:20px; font-size:12px; position: relative; top: 7px;">'+language_data[language_code]._katalipsi_pezodromiou+'</span>'+
                                    '</label>'+
                                    '<label class="radio radio-padding-left widget uib_w_26 label_radio_btn_line_height" data-uib="twitter%20bootstrap/radio_button" data-ver="1">'+
                                        '<input type="radio" name="bs-radio-group-2" onclick="clear_txt_road()" id="spasmeno_pagkaki" value="'+language_data[language_code]._spasmeno_pagkaki+'"><span style="padding-left:20px; font-size:12px; position: relative; top: 7px;">'+language_data[language_code]._spasmeno_pagkaki+'</span>'+
                                    '</label>'+
                                    '<label class="radio radio-padding-left widget uib_w_26 label_radio_btn_line_height" data-uib="twitter%20bootstrap/radio_button" data-ver="1">'+
                                        '<input type="radio" name="bs-radio-group-2" onclick="clear_txt_road()" id="kakotexnia" value="'+language_data[language_code]._kakotexnia+'"><span style="padding-left:20px; font-size:12px; position: relative; top: 7px;">'+language_data[language_code]._kakotexnia+'</span>'+
                                    '</label>'+
                                    '<label class="radio radio-padding-left widget uib_w_27 label_radio_btn_line_height" data-uib="twitter%20bootstrap/radio_button" data-ver="1">'+
                                        '<input type="radio" name="bs-radio-group-2" id="rdio_other_road" onclick="focus_txt_road()"><span style="padding-left:20px; font-size:12px; position: relative; top: 7px;">'+language_data[language_code]._other_road+'</span>'+
                                    '</label>'+
                                '</fieldset>'+
                                '<div class="table-thing widget uib_w_33 d-margins" data-uib="twitter%20bootstrap/input" data-ver="1">'+
                                    '<label class="narrow-control"></label>'+
                                    '<input class="wide-control form-control default" type="text" placeholder="'+language_data[language_code]._road_msg+'" id="txt_road_msg" onclick="enable_txt_road()">'+
                                '</div><script>$("#txt_road_msg").hide(); </script>');
        
		activate_page("#uib_page_test"); 
    });
    
     
    $(document).on("click", "#protection_policy_allo", function(evt)
    {
        if($("#protection_policy_allo").prop("checked",true)){
            $("#txt_protection_policy_other").show();
        }        
    });
    
    $(document).on("click", "#protection_policy_theomynia", function(evt)
    {
        $("#txt_protection_policy_other").hide();
    });
    
    $(document).on("click", "#protection_policy_clean_land", function(evt)
    {
        $("#txt_protection_policy_other").hide();
    });
   
    $(document).on("click", "#btn_green_allo", function(evt)
    {
        if($("#btn_green_allo").prop("checked",true)){
            $("#txt_green_msg").show();
        }        
    });
    
    $(document).on("click", "#btn_green_kopi_xorton", function(evt)
    {
        $("#txt_green_msg").hide();
    });
    
    $(document).on("click", "#btn_green_kladeuma_dentron", function(evt)
    {
        $("#txt_green_msg").hide();
    });
     
    $(document).on("click", "#allo_enviroment", function(evt)
    {
        if($("#allo_enviroment").prop("checked",true)){
            $("#txt_enviroment_issue").show();
        }        
    });
    
    $(document).on("click", "#adespoto_zoo", function(evt)
    {
        $("#txt_enviroment_issue").hide();
    });
    
    $(document).on("click", "#anakyklwsi", function(evt)
    {
        $("#txt_enviroment_issue").hide();
    });
    
    $(document).on("click", "#btn_green_mioktonies", function(evt)
    {
        $("#txt_enviroment_issue").hide();
    });
    
    $(document).on("click", "#btn_green_entomoktonia", function(evt)
    {
        $("#txt_enviroment_issue").hide();
    });
    
     /* button  #btn_back_1 */
    $(document).on("click", "#btn_back_1", function(evt)
    {
         /*global activate_subpage */
         activate_subpage("#page_78_74"); 
    });
    

	 
	 
	 
	 
	 
	 
	 
	 
	 
	 
	 
	 
	 
	 
	 
	 
	 
	 
	 
 
    
    /* button  #btn_angry */
    $(document).on("click", "#btn_angry", function(evt)
    {
        
        if(!checkConnection())
        {
            $(".modal-body").html(language_data[language_code]._msg_no_internet);
                $(".uib_w_67").modal("toggle");
                return false;
        }
        
         /* Other options: .modal("show")  .modal("hide")  .modal("toggle")
         See full API here: http://getbootstrap.com/javascript/#modals 
            */
        if(_longitude === 0 || _lattitude === 0 || _longitude===null || _lattitude===null){

                $(".modal-body").html(language_data[language_code]._msg_no_gps);
                $(".uib_w_67").modal("toggle");
                return false;
        }
        
        /* your code goes here */ 
        
        $.ajax({
            type: "POST",
            url: APIURL+"/feelings",
            data: '{"loc" : { "type" : "Point",  "coordinates" : ['+_longitude+','+_lattitude+'] }, "issue" : "angry","device_id" : "' + code_txt + '", "value_desc" : "Άσχημη" }',
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function(data){                
                $(".uib_w_49").modal("toggle");  
            },
            failure: function(errMsg) {
                $(".uib_w_49").modal("toggle");
            }
        });
        
    });
    
        /* button  #btn_neutral */
    $(document).on("click", "#btn_neutral", function(evt)
    {
        if(!checkConnection())
        {
                
            $(".modal-body").html(language_data[language_code]._msg_no_internet);
                $(".uib_w_67").modal("toggle");
                return false;
            
        }
        
         /* Other options: .modal("show")  .modal("hide")  .modal("toggle")
         See full API here: http://getbootstrap.com/javascript/#modals 
            */
        if(_longitude === 0 || _lattitude === 0 || _longitude===null || _lattitude===null){

                $(".modal-body").html(language_data[language_code]._msg_no_gps);
                $(".uib_w_67").modal("toggle");
                return false;
        }
        
        /* your code goes here */
        $.ajax({
            type: "POST",
            url: APIURL+"/feelings",
            data: '{"loc" : { "type" : "Point",  "coordinates" : ['+_longitude+','+_lattitude+'] }, "issue" : "neutral","device_id" : "' + code_txt + '", "value_desc" : "Ουδέτερος" }',
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function(data){
                $(".uib_w_49").modal("toggle");
            },
            failure: function(errMsg) {
                $(".uib_w_49").modal("toggle");
            }
        });
        
    });
    
     
     // onSuccess Callback 
            // This method accepts a Position object, which contains the 
            // current GPS coordinates 
            // 
            var onSuccess = function(position) {
              /*  alert('Latitude: '          + position.coords.latitude          + '\n' +
                      'Longitude: '         + position.coords.longitude         + '\n' +
                      'Altitude: '          + position.coords.altitude          + '\n' +
                      'Accuracy: '          + position.coords.accuracy          + '\n' +
                      'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
                      'Heading: '           + position.coords.heading           + '\n' +
                      'Speed: '             + position.coords.speed             + '\n' +
                      'Timestamp: '         + position.timestamp                + '\n');*/
                
                _lattitude = position.coords.latitude;
                _longitude = position.coords.longitude;
    
            };

            // onError Callback receives a PositionError object 
            // 
            function onError(error) {
                alert('code: '    + error.code    + '\n' + 'message: ' + error.message + '\n');
            }
     
     
     
        /* button  #btn_happy */
    $(document).on("click", "#btn_happy", function(evt)
    {
        navigator.geolocation.getCurrentPosition(onSuccess, onError);
   
        if(!checkConnection())
        {
                
            $(".modal-body").html(language_data[language_code]._msg_no_internet);
                $(".uib_w_67").modal("toggle");
                return false;
            
        }
        
         /* Other options: .modal("show")  .modal("hide")  .modal("toggle")
         See full API here: http://getbootstrap.com/javascript/#modals 
            */
        if(_longitude === 0 || _lattitude === 0 || _longitude===null || _lattitude===null){

                $(".modal-body").html(language_data[language_code]._msg_no_gps);
                $(".uib_w_67").modal("toggle");
                return false;
        }
        
        /* your code goes here */ 
         $.ajax({
            type: "POST",
            url: APIURL+"/feelings",
            data: '{"loc" : { "type" : "Point",  "coordinates" : ['+_longitude+','+_lattitude+'] }, "issue" : "happy","device_id" : "' + code_txt + '", "value_desc" : "Χαρούμενος" }',
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function(data){
                $(".uib_w_49").modal("toggle");
            },
            failure: function(errMsg) {
                $(".uib_w_49").modal("toggle");
            }
        });
    });
    
        /* button  #btn_map */
    $(document).on("click", "#btn_map", function(evt)
    {
        if(!checkConnection())
        {
            $(".modal-body").html(language_data[language_code]._msg_no_internet);
                $(".uib_w_67").modal("toggle");
                return false;
        }
        
        
         /* Other options: .modal("show")  .modal("hide")  .modal("toggle")
         See full API here: http://getbootstrap.com/javascript/#modals 
            */
        if(_longitude === 0 || _lattitude === 0 ){

                $(".modal-body").html(language_data[language_code]._msg_no_gps);
                $(".uib_w_67").modal("toggle");
                return false;
        }
        activate_subpage("#uib_page_map"); 
        
        var _startdate = new Date();
        var _enddate=new Date();
        _startdate.setDate(_startdate.getDate() -3);         
        
        if(map===null){            
         map = L.map('map').setView( new L.LatLng( _lattitude, _longitude ), 12);
        }else
            {
                map.panTo(new L.LatLng(_lattitude, _longitude));
            }
        show_map();
        
        uib_sb.toggle_sidebar($(".uib_w_39")); 
    });
    
	 
	 
    /* button  #btn_home */
    $(document).on("click", "#btn_home", function(evt)
    {
        activate_subpage("#page_78_74"); 
        uib_sb.toggle_sidebar($(".uib_w_39")); 
    });
     
        /* graphic button  #btn_send_twitter */
    $(document).on("click", "#btn_send_twitter", function(evt)
    {
        window.plugins.socialsharing.shareViaTwitter("#"+_city+ language_data[language_code]._msg_info_social_1 +" ("+value_description + ") .... https://"+_city+".sense.city/#!/scissuemap="+issue_id, null /* img */, null /* url */, function() {navigator.notification.console.log('share ok');} , function(errormsg){navigator.notification.alert(errormsg);});

    });
	 
	$(document).on("click", "#btn_send_twitter_new", function(evt)
    {
        window.plugins.socialsharing.shareViaTwitter("#"+_city+ language_data[language_code]._msg_info_social_1 +" ("+value_description + ") .... https://"+_city+".sense.city/#!/scissuemap="+issue_id, null /* img */, null /* url */, function() {navigator.notification.console.log('share ok');} , function(errormsg){navigator.notification.alert(errormsg);});		
    });
	 
    
        /* graphic button  #btn_send_facebook */
    $(document).on("click", "#btn_send_facebook", function(evt)
    {
        window.plugins.socialsharing.shareViaFacebookWithPasteMessageHint(_city + '-'+ language_data[language_code]._msg_info_social_1 +' ('+value_description + ') .... https://'+_city+'.sense.city/#!/scissuemap='+issue_id , null /* img */, null /* url */, language_data[language_code]._msg_info_social_2, function() {navigator.notification.console.log('share ok');}, function(errormsg){navigator.notification.alert(errormsg);});
    });
    
	$(document).on("click", "#btn_send_facebook_new", function(evt)
    {  
		window.plugins.socialsharing.shareViaFacebookWithPasteMessageHint(_city + '-'+ language_data[language_code]._msg_info_social_1 +' ('+value_description + ') .... https://'+_city+'.sense.city/#!/scissuemap='+issue_id , null /* img */, null /* url */, language_data[language_code]._msg_info_social_2, function() {navigator.notification.console.log('share ok');}, function(errormsg){navigator.notification.alert(errormsg);});
                
    });
     
	$(document).on("click", "#btn_popup_final_verify", function(evt)
    {		
		if($("#txt_popup_plumbing_verify_code_email").is(":visible")){
			if($("#txt_popup_plumbing_verify_code_email").val()!==""){
				$("#btn_popup_final_verify").html(language_data[language_code]._btn_popup_final_verify);
				$.ajax({
						crossDomain: true,
						type:"POST",
						url: APIURL+"/activate_email?uuid=web-site&code="+$("#txt_popup_plumbing_verify_code_email").val()+"&email="+$("#txt_email_verify_popup").val(),
						contentType: "application/json; charset=utf-8",
						success: function(msg){ 							
							
							if(msg.nModified===1){
								$("#popup_pumbing_email_verify").modal("toggle");
								$("#popup_verify").modal("toggle");
								$("#popup_verify").modal("toggle");
								$("#btn_popup_final_verify").html(language_data[language_code]._btn_verify_email);
								$('#btn_verify_email').html(language_data[language_code]._btn_verify_email_complete);
								
								updateIndexedDB(name_user, $("#txt_email_verify_popup").val(), mobile_user, language_user);								
								
							}else{								
								$("#btn_popup_final_verify").html(language_data[language_code]._btn_verify_email);
								$('#msg_popup_verify_email_txt').html("");
								$('#msg_popup_verify_email_txt').html(language_data[language_code]._msg_popup_verify_email_txt);
							}
						} 
				});
			}
			else{
				$('#msg_popup_verify_email_txt').html("");
				$('#msg_popup_verify_email_txt').html(language_data[language_code]._msg_popup_verify_email_txt_1);
			}
		}else{
			
			$("#popup_pumbing_email_verify").modal("toggle");
		}
		 
	 });
     
	 $(document).on("click", "#btn_change_user_info", function(evt){		 
         $("#popup_verify").modal("toggle");
		 
		 if(name_user != ''){							
			$("#txt_popup_name").val($("#txt_plumbing_settings_name").val());
		}

		if(email_user != ''){
			$("#txt_email_verify_popup").val(email_user.toString());
		}

		if(mobile_user != ''){
			$("#txt_mobile_number").val(mobile_user.toString());
		}
		 
		$("#txt_popup_name").val($("#txt_plumbing_settings_name").val());
		$("#txt_email_verify_popup").val($("#txt_plumbing_settings_email").val());
		$("#txt_mobile_number").val($("#txt_plumbing_settings_mobile").val());
		 
     });
     
     $(document).on("click", "#popup_verify_header_close", function(evt){
		 
		 if($("txt_plumbing_settings_name").val()!=='' || $("txt_plumbing_settings_mobile").val()!=='' || $("$txt_plumbing_settings_email").val()!==''){
			 $("#popup_verify").modal("hide");
			 $.ajax({
                crossDomain: true,
                type:"GET",
                url: APIURL+"/active_users?uuid=" + device_uuid,
                dataType: "json",                
                success: function(msg){		
					
					
					if(allow_anonymous === "false"){												
						if(msg[0] !== undefined ){
						
                        	activate_user = msg[0].activate;
							activate_sms = msg[0].activate_sms;
							
							if(mandatory_email === "true"){
								$('#chk_email').attr("disabled", true);
								$("#chk_email")[0].checked = true;
							}else{
								if(msg[0].permission.communicate_with.email==="true"){
									$('#chk_email')[0].checked =true;
								}else{
									$('#chk_email')[0].checked =false;
								}
							}
						
							if(mandatory_sms === true){							
								$('#chk_sms').attr("disabled", true);
								$("#chk_sms")[0].checked = true;
							} else {	
								if(msg[0].permission.communicate_with.sms==="true"){
									$("#chk_sms")[0].checked = true;
								}else{
									$("#chk_sms")[0].checked = false;
								}
							}

							$("#txt_plumbing_settings_name").val(msg[0].name);
							$("#txt_plumbing_settings_email").val(msg[0].email);
							$("#txt_plumbing_settings_mobile").val(msg[0].mobile_num);
						}
						else{						
							$("#popup_verify").modal("show");					
						}
						
					}
					
                }
            });
		 }else{
			$("#popup_verify").modal("toggle");
			$('#chk_anonymus_popup_window_plumbing').prop("checked", false);         	
		 	$("#btn_send_plumbing").html(language_data[language_code]._btn_send_plumbing);	 
		 }
          
		 
     });

     $(document).on("click", "#btn_popup_plumbing_verify_sms", function(evt)
    {
		 if($("#txt_popup_plumbing_verify_sms_code").val()!==""){
		 $("#btn_popup_plumbing_verify_sms").html(language_data[language_code]._btn_popup_plumbing_verify_sms);
		 $.ajax({
				crossDomain: true,
				type:"POST",
				url: APIURL+"/activate_mobile?uuid=web-site&code="+$("#txt_popup_plumbing_verify_sms_code").val()+"&mobile="+$("#txt_mobile_number").val(),
				contentType: "application/json; charset=utf-8",
				success: function(msg){

					if(msg.nModified===1){
						$("#popup_pumbing_sms_verify").modal("toggle"); 				
						$("#btn_popup_plumbing_verify_sms").html(language_data[language_code]._btn_popup_plumbing_verify_sms_shield);	
						
						updateIndexedDB(name_user, email_user, $("#txt_mobile_number").val(), language_user);						
						
					}
					else {
						
						$("#btn_popup_plumbing_verify_sms").html(language_data[language_code]._btn_popup_plumbing_verify_sms_shield);	
						$('#msg_popup_verify_mobile_txt').html("");
						$('#msg_popup_verify_mobile_txt').html(language_data[language_code]._msg_popup_verify_mobile_txt);
					}
					
				}
		  });
		 }else{
			 $('#msg_popup_verify_mobile_txt').html("");
			$('#msg_popup_verify_mobile_txt').html(language_data[language_code]._msg_popup_verify_mobile_txt_msg);
		 }
	 });
	
		
		
	/*   *********************    DEN TO XREISIMOPOIW   ***********************   */
		
		
    /* button  #btn_verify */
    $(document).on("click", "#btn_verify", function(evt)
    {
        $("#txt_activate_code").css("display","none");
        if($("#txt_popup_settings_name").val()===null || $("#txt_popup_settings_email").val()===null || $("#txt_popup_settings_mobile").val()===null ||  $("#txt_activate_code").val()===null)
        {
            alert("please fill all the gups!!");
            return false;
        }
        
        
        $("#lbl_message_verify").text("Για να ολοκληρώσετε την πιστοποίηση ακολουθήστε τις οδηγίες που σας έχουν σταλεί στο email που έχετε δηλώση!");
        
         var jsonData = '{ "uuid" : "'+device_uuid+'", "name": "'+$("#txt_popup_settings_name").val()+'", "email": "'+$("#txt_popup_settings_email").val()+'", "mobile_num": "'+$("#txt_popup_settings_mobile").val()+'", "permission" :  { "send_issues": "true" , "communicate_with": {"email" : "'+$("#set_chk_email").is(":checked").toString()+'", "sms" : "'+$("#set_chk_sms").is(":checked").toString()+'"}}}';       
        
        $.ajax({
			crossDomain: true,
			type:"POST",
			url: APIURL+"/active_users",
			contentType: "application/json; charset=utf-8",
			dataType: "json",               
			data:jsonData,
			success: function(msg){
				$("#txt_activate_code").css("display","block");
                        
                        
				var jsonact_Data = '{ "id1" : "'+msg._id+'", "id2": "'+device_uuid+'", "id3": "'+$("#txt_activate_code").val()+'"}';
        
				$.ajax({
					crossDomain: true,
					type:"POST",
					url: APIURL+"/activate_users",
					contentType: "application/json; charset=utf-8",
					dataType: "json",               
					data:jsonact_Data,
					success: function(msg1){
					
					}
				});                        
			}
		});
        
		$(".uib_w_90").modal("toggle"); 
    });
    
	/*    *********************    End DEN TO XREISIMOPOIW     *********************  */
		
	/*   *********************    DEN TO XREISIMOPOIW   ***********************   */
		
    $(document).on("click", "#btn_popup_save", function(evt)
    {
        
        if($("#txt_popup_settings_name").val()==='' || $("#txt_popup_settings_email").val()===''){
            $('#setting_popup_alert').css("display","block");
            $('#setting_popup_alert').html("Παρακαλώ συμπληρώστε όλα τα πεδία!");
            return false;
        }
        
         var jsonData = '{ "uuid" : "'+device_uuid+'", "name": "'+$("#txt_popup_settings_name").val()+'", "email": "'+$("#txt_popup_settings_email").val()+'", "mobile_num": "'+$("#txt_popup_settings_mobile").val()+'", "permission" :  { "send_issues": "true" , "communicate_with": {"email" : "'+$("#btn_settings_ans_email").is(":checked").toString()+'", "sms" : "'+$("#btn_settings_ans_sms").is(":checked").toString()+'"}}}';       
        
        $.ajax({
					crossDomain: true,
					type:"POST",
					url: APIURL+"/active_users",
					contentType: "application/json; charset=utf-8",
                    dataType: "json",               
                    data:jsonData,
					success: function(msg){						
                        if(msg.activate != "1"){
                            
                            $("#btn_popup_save").css("display","none");
                            $("#verify_msg_popup").css("display","block");
                            
                            $("#txt_pop_up_activate_code").css("display","block");
                             activate_user_id = msg._id;
                        }
                        $('#setting_popup_alert').css("display","none");
                    }
        });
        
         return false;
    });
		
	/*   *********************    End DEN TO XREISIMOPOIW   ***********************   */
    
    /* button  #btn_protection_policy */
    $(document).on("click", "#btn_protection_policy", function(evt)
    {
        clear_fields();			
									
		issue_ch="protection-policy";
		$("#container_issues").html('<fieldset class="widget uib_w_126 d-margins" data-uib="twitter%20bootstrap/radio_group" data-ver="1" data-child-name="bs-radio-group-6">'+
                                    '<label class="radio radio-padding-left widget uib_w_127 label_radio_btn_line_height" data-uib="twitter%20bootstrap/radio_button" data-ver="1">'+
                                        '<input type="radio" name="bs-radio-group-6" onclick="clear_txt_protection_policy()" value="Θεομηνία" id="protection_policy_theomynia"><span style="padding-left:20px; font-size:12px; position: relative; top: 7px;">'+language_data[language_code]._protection_policy_theomynia+'</span>'+
                                    '</label>'+
                                    '<label class="radio radio-padding-left widget uib_w_127 label_radio_btn_line_height" data-uib="twitter%20bootstrap/radio_button" data-ver="1">'+
                                        '<input type="radio" name="bs-radio-group-6" onclick="clear_txt_protection_policy()" value="Ακαθάριστο Οικόπεδο" id="protection_policy_clean_land"><span style="padding-left:20px; font-size:12px; position: relative; top: 7px;">' + language_data[language_code]._protection_policy_clean_land + '</span>'+
                                    '</label>'+
                                    '<label class="radio radio-padding-left widget uib_w_128 label_radio_btn_line_height" data-uib="twitter%20bootstrap/radio_button" data-ver="1">'+
                                        '<input type="radio" name="bs-radio-group-6" onclick="focus_txt_protection_policy()" id="protection_policy_allo" value="Άλλο"><span style="padding-left:20px; font-size:12px; position: relative; top: 7px;">'+language_data[language_code]._protection_policy_allo+'</span>'+
                                    '</label>'+
                                '</fieldset>'+
                                '<div class="table-thing widget uib_w_129 d-margins" data-uib="twitter%20bootstrap/input" data-ver="1">'+
                                    '<label class="narrow-control"></label>'+
                                    '<input class="wide-control form-control default" type="text" placeholder="'+language_data[language_code]._protection_policy_other+'" id="txt_protection_policy_other" onclick="enable_txt_protection_policy()">'+
                                '</div><script>$("#txt_protection_policy_other").hide(); </script>');
		 
		activate_page("#uib_page_test");
        return false;
    });
    
        /* button  #btn_green */
    $(document).on("click", "#btn_green", function(evt)
    {
        clear_fields();

		issue_ch="green";
		$("#container_issues").html('<fieldset class="widget uib_w_110 d-margins" data-uib="twitter%20bootstrap/radio_group" data-ver="1" data-child-name="bs-radio-group-5">'+
                                    '<label class="radio radio-padding-left widget uib_w_111 label_radio_btn_line_height" data-uib="twitter%20bootstrap/radio_button" data-ver="1">'+
                                        '<input type="radio" name="bs-radio-group-5" onclick="clear_txt_green()" id="btn_green_kopi_xorton" value="Κοπή Χόρτων"><span style="padding-left:20px; font-size:12px; position: relative; top: 7px;">'+language_data[language_code]._green_kopi_xorton+'</span>'+
                                    '</label>'+
                                    '<label class="radio radio-padding-left widget uib_w_112 label_radio_btn_line_height" data-uib="twitter%20bootstrap/radio_button" data-ver="1">'+
                                        '<input type="radio" name="bs-radio-group-5" onclick="clear_txt_green()" id="btn_green_kladeuma_dentron" value="Κλάδευμα Δέντρων"><span style="padding-left:20px; font-size:12px; position: relative; top: 7px;">'+language_data[language_code]._green_kladeuma_dentron+'</span>'+
                                    '</label>'+
                                    '<label class="radio radio-padding-left widget uib_w_113 label_radio_btn_line_height" data-uib="twitter%20bootstrap/radio_button" data-ver="1">'+
                                        '<input type="radio" name="bs-radio-group-5" id="btn_green_allo" value="" onclick="focus_txt_green()"><span style="padding-left:20px; font-size:12px; position: relative; top: 7px;">'+language_data[language_code]._green_allo+'</span>'+
                                    '</label>'+
                                '</fieldset>'+
                                '<div class="table-thing widget uib_w_23 d-margins" data-uib="twitter%20bootstrap/input" data-ver="1">'+
                                    '<label class="narrow-control" for="txt_green_msg"></label>'+
                                    '<input class="wide-control form-control default" type="text" placeholder="'+language_data[language_code]._green_msg+'" id="txt_green_msg" onclick="enable_txt_green()">'+
                                '</div><script>$("#txt_green_msg").hide(); </script>');
		 
        // activate_subpage("#uib_green"); 
		activate_page("#uib_page_test");
         return false;
    });
    
        /* button  #btn_popup_return */
    $(document).on("click", "#btn_popup_return", function(evt)
    {
        clear_fields();
        
        activate_subpage("#page_78_74"); 
        $(".uib_w_49").modal("toggle");
        // return false;
    });    
	 
    $(document).on("click", "#btn_popup_return_new", function(evt)
    {
        clear_fields();
        
        activate_subpage("#page_78_74"); 
        $(".uib_w_189").modal("toggle");
        // return false;
    }); 
    
        /* button  #btn_plumbing_cancel */
    $(document).on("click", "#btn_plumbing_cancel", function(evt)
    {
         clear_fields();
         activate_subpage("#page_78_74"); 
         return false;
    });
    
    $(document).on("click", "#btn_environmental_issues", function(evt)
    {
        clear_fields();
		
		issue_ch = "environment";
		$("#container_issues").html('<fieldset class="widget uib_w_14 d-margins" data-uib="twitter%20bootstrap/radio_group" data-ver="1" data-child-name="bs-radio-group-0">'+
                                    /*'<label class="radio radio-padding-left widget uib_w_15 label_radio_btn_line_height" data-uib="twitter%20bootstrap/radio_button" data-ver="1">'+
                                        '<input type="radio" name="bs-radio-group-0" onclick="clear_txt_enviroment()" id="adespoto_zoo" value="Αδέσποτο Ζώο"><span style="padding-left:20px; font-size:12px; position: relative; top: 7px; ">'+language_data[language_code]._adespoto_zoo+'</span>'+
                                    '</label>'+*/
                                    '<label class="radio radio-padding-left widget uib_w_15 label_radio_btn_line_height" data-uib="twitter%20bootstrap/radio_button" data-ver="1">'+
                                        '<input type="radio" name="bs-radio-group-0" onclick="clear_txt_enviroment()" id="anakyklwsi" value="Ανακύκλωση"><span style="padding-left:20px; font-size:12px; position: relative; top: 7px; ">'+language_data[language_code]._anakyklwsi+'</span>'+
                                    '</label>'+
                                    '<label class="radio radio-padding-left widget uib_w_113 label_radio_btn_line_height" data-uib="twitter%20bootstrap/radio_button" data-ver="1">'+
                                        '<input type="radio" name="bs-radio-group-0" onclick="clear_txt_enviroment()" id="btn_green_mioktonies" value="Μυοκτονίες"><span style="padding-left:20px; font-size:12px; position: relative; top: 7px;">'+language_data[language_code]._green_mioktonies+'</span>'+
                                    '</label>'+
                                    '<label class="radio radio-padding-left widget uib_w_113 label_radio_btn_line_height" data-uib="twitter%20bootstrap/radio_button" data-ver="1">'+
                                        '<input type="radio" name="bs-radio-group-0" onclick="clear_txt_enviroment()" id="btn_green_entomoktonia" value="Εντομοκτονία"><span style="padding-left:20px; font-size:12px; position: relative; top: 7px;">'+language_data[language_code]._green_entomoktonia+'</span>'+
                                    '</label>'+
                                    '<label class="radio radio-padding-left widget uib_w_17 label_radio_btn_line_height" data-uib="twitter%20bootstrap/radio_button" data-ver="1">'+
                                        '<input type="radio" name="bs-radio-group-0" onclick="focus_txt_enviroment()" id="allo_enviroment"><span style="padding-left:20px; font-size:12px; position: relative; top: 7px;">'+language_data[language_code]._allo_enviroment+'</span>'+
                                    '</label>'+
                                '</fieldset>'+
                                '<div class="table-thing widget uib_w_18 d-margins" data-uib="twitter%20bootstrap/input" data-ver="1">'+
                                    '<label class="narrow-control" for="txt_enviroment_issue"></label>'+
                                    '<input class="wide-control form-control default" type="text" placeholder="'+language_data[language_code]._enviroment_issue+'" id="txt_enviroment_issue" onclick="enable_txt_enviroment()">'+
                                '</div><script>$("#txt_enviroment_issue").hide(); </script>');
		 
		activate_page("#uib_page_test");
         return false;
    });
    
    
        /* button  #btn_policy */
    $(document).on("click", "#btn_policy", function(evt)
    {
        activate_subpage("#uib_sub_privacy");
        uib_sb.toggle_sidebar($(".uib_w_39")); 
        
        $.ajax({
            type: "GET",
            url: APIURL+"/policy",
            crossDomain: true,
            dataType: "json",
            success: function(msg){	
                $("#policy_txt").html(msg.policy);
            }
        });
        
        /* your code goes here */ 
         return false;
    });
    
        /* button  #btn_send_report_sensecity */
    $(document).on("click", "#btn_send_report_sensecity", function(evt)
    {
        activate_subpage("#sub_page_sense_report");
        uib_sb.toggle_sidebar($(".uib_w_39")); 
		
         return false;
    });
    
        /* button  #btn_send_mail */
    $(document).on("click", "#btn_send_mail", function(evt)
    {
        $.ajax({
			crossDomain: true,
			type:"GET",
			url: APIURL+"/active_users?uuid=" + device_uuid,
            dataType: "json",                
            success: function(msg){           
                if(msg[0].activate=="1"){
                   $.ajax({
                        type: "POST",
                        url: APIURL+"/send_email",
                        data: '{"uuid": "'+msg[0].uuid+'", "name" : "'+msg[0].name+'","email" : "'+msg[0].email+'", "phonenumber" : "'+msg[0].mobile_num +'", "subject" : "'+$("#mail_subject").val() +'", "comments" : "'+$("#mail_content").val()+'" }',
                        contentType: "application/json; charset=utf-8",
                        dataType: "json",
                        success: function(data){
							
                            if(data == "ok"){
                                $("#send_mail_msg").html(language_data[language_code]._msg_info_sent_email_1);
                            }
                            else{
                                $("#send_mail_msg").html(language_data[language_code]._msg_info_sent_email_2);
                            }
                        }
                   });
                }
                else{
                    
                    $("#send_mail_msg").html(language_data[language_code]._msg_info_sent_email_2);
                }  
            }        
        });
        
        /* your code goes here */
        
        return false;
    });
    
        /* button  #btn_home_page */
    $(document).on("click", "#btn_home_page", function(evt)
    {
        /*global activate_subpage */
         activate_subpage("#page_78_74"); 
        uib_sb.toggle_sidebar($(".uib_w_39")); 
         return false;
    });
    
		
	/*      ************************    DEN TO XREISIMOPOIW      ************************     */
        /* button  #test_garbage */
    $(document).on("click", "#test_garbage", function(evt)
    {         
        $("#btn_back_test").prop("disabled", true);
        /* your code goes here */ 
         return false;
    });
	
	/*      ************************    END DEN TO XREISIMOPOIW      ************************     */
       
    $(document).on("click", "#btn_plumbing_next", function(evt)
    {		
		
		console.log(issue_ch);
		
        if($('#chk_anonymus_popup_window_plumbing').is(':checked')){
			if(mybug_comes==1){
            	$("#btn_send_plumbing").html(language_data[language_code]._msg_register_to_issue);
			}else{
				$("#btn_send_plumbing").html(language_data[language_code]._send_plumbing_loading);
			}
        }else{
            $("#btn_send_plumbing").html(language_data[language_code]._btn_send_plumbing);
        }
        
		if(count_step<7){
         	count_step++;
		}
               
        if(count_step===0){
            issue_step(0);			
        }
        else if (count_step===1){
			value_description="";
            if(issue_ch==="garbage"){
				if($("#xalamenos").is(':checked')){
					value_description = $("#xalamenos").val();
				}else if($("#ogkodis_antikeimena").is(':checked')){
					value_description = $("#ogkodis_antikeimena").val();
				}else if($("#katapatisi_koinoxriston_xoron").is(':checked')) {
					value_description = $("#katapatisi_koinoxriston_xoron").val();
				}else if($("#komena_kladia").is(':checked')) {
					value_description = $("#komena_kladia").val();
				}else if($("#mpaza").is(':checked')) {
					value_description = $("#mpaza").val();
				}else if($("#katharismos_plateias").is(':checked')) {
					value_description = $("#katharismos_plateias").val();
				}else if($("#mixanokiniti_sarosi").is(':checked')) {
					value_description = $("#mixanokiniti_sarosi").val();
				}else if($("#allo_garbage").is(':checked')) {
					value_description = $("#txt_garbage_msg").val();
				}
			}
			else if(issue_ch==="plumbing"){
				if($("#voulomeno_freatio").is(':checked')){
					value_description = $("#voulomeno_freatio").val();
				}else if($("#spasmeno_freatio").is(':checked')) {
					value_description = $("#spasmeno_freatio").val();
				}else if($("#diaroi_nerou").is(':checked')) {
					value_description = $("#diaroi_nerou").val();
				}else if($("#rdio_other_plumbing").is(':checked')) {
					value_description = $("#txt_plumbing_msg").val();
				}
								
			}else if(issue_ch==="lighting"){
				if($("#kamenos_lamptiras").is(':checked')){
					value_description = $("#kamenos_lamptiras").val();
				}else if($("#spasmenos_vraxionas").is(':checked')) {
					value_description = $("#spasmenos_vraxionas").val();
				}else if($("#aneparkis_fotismos").is(':checked')) {
					value_description = $("#aneparkis_fotismos").val();
				}else if($("#topothetisi_fotismos").is(':checked')) {
					value_description = $("#topothetisi_fotismos").val();
				}else if($("#rdio_other_light").is(':checked')) {
					value_description = $("#txt_lighting_msg").val();
				}
			}else if(issue_ch === "road-constructor"){
				if($("#lakouva").is(':checked')){
					value_description = $("#lakouva").val();
				}else if($("#katapatisi_koinoxriston_xoron").is(':checked')) {
					value_description = $("#katapatisi_koinoxriston_xoron").val();
				}else if($("#spasmenes_plakes_pez").is(':checked')) {
					value_description = $("#spasmenes_plakes_pez").val();
				}else if($("#egkatalelimeno_autokinito").is(':checked')) {
					value_description = $("#egkatalelimeno_autokinito").val();
				}else if($("#katalipsi_pezodromiou").is(':checked')) {
					value_description = $("#katalipsi_pezodromiou").val();
				}else if($("#spasmeno_pagkaki").is(':checked')) {
					value_description = $("#spasmeno_pagkaki").val();
				}else if($("#kakotexnia").is(':checked')) {
					value_description = $("#kakotexnia").val();
				}else if($("#rdio_other_road").is(':checked')) {
					value_description = $("#txt_road_msg").val();
				}
			}else if(issue_ch === "protection-policy"){
				if($("#protection_policy_theomynia").is(':checked')) {
					value_description = $("#protection_policy_theomynia").val();
				}else if($("#protection_policy_clean_land").is(':checked')) {
					value_description = $("#protection_policy_clean_land").val();
				}else if($("#protection_policy_allo").is(':checked')) {
					value_description = $("#txt_protection_policy_other").val();
				}else{
					value_description="";
				}
			}else if(issue_ch === "green"){
				if($("#btn_green_kopi_xorton").is(':checked')){            
					value_description = $("#btn_green_kopi_xorton").val();
				}else if($("#btn_green_kladeuma_dentron").is(':checked')) {
					value_description = $("#btn_green_kladeuma_dentron").val();
				}else if($("#btn_green_allo").is(':checked')) {
					value_description = $("#txt_green_msg").val();
				}
			}else if(issue_ch === "environment"){				
				/*if($("#adespoto_zoo").is(':checked')){
					value_description = $("#adespoto_zoo").val();
				}else*/ if($("#anakyklwsi").is(':checked')) {
					value_description = $("#anakyklwsi").val();
				}else if($("#btn_green_mioktonies").is(':checked')) {
					value_description = $("#btn_green_mioktonies").val();
				}else if($("#btn_green_entomoktonia").is(':checked')) {
					value_description = $("#btn_green_entomoktonia").val();
				}else if($("#allo_enviroment").is(':checked')) {
					value_description = $("#txt_enviroment_issue").val();
				}
			}
			
            if(value_description ===''){
                $("#popup_info").modal("toggle");
				$("#popup_info_details").html(language_data[language_code]._popup_info_details);
				
                count_step--;
            }else{
				issue_step(1);
            }
            
        }
        else if(count_step===2){
			issue_step(2);
        }else if(count_step===3){
			issue_step(3);
            if(map_plumbing===undefined){
                
                map_plumbing = L.map('map_point_plumbing').setView( new L.LatLng( _lattitude, _longitude ), 18);                
                positionlat = _lattitude;//msg[0].loc.coordinates[1];
                positionlon = _longitude;//msg[0].loc.coordinates[0];						
				set_lattitude=_lattitude;
				set_longitude=_longitude;

                L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>', maxZoom: 18, }).addTo(map_plumbing);
				switch(issue_ch){
					case "garbage":
                		redMarker_plumbing = L.AwesomeMarkers.icon({icon: 'trash-o',prefix: 'fa',markerColor: 'red'});              
						break;
					case "lighting":
						redMarker_plumbing = L.AwesomeMarkers.icon({icon: 'lightbulb-o',prefix: 'fa',markerColor: 'red'});              
						break;
					case "environment":
						redMarker_plumbing = L.AwesomeMarkers.icon({icon: 'leaf',prefix: 'fa',markerColor: 'red'});              
						break;
					case "green":
						redMarker_plumbing = L.AwesomeMarkers.icon({icon: 'tree',prefix: 'fa',markerColor: 'red'});              
						break;
					case "protection-policy":
						redMarker_plumbing = L.AwesomeMarkers.icon({icon: 'shield',prefix: 'fa',markerColor: 'red'});              
						break;
					case "road-constructor":
						redMarker_plumbing = L.AwesomeMarkers.icon({icon: 'road',prefix: 'fa',markerColor: 'red'});              
						break;
					case "plumbing":
						redMarker_plumbing = L.AwesomeMarkers.icon({icon: 'umbrella',prefix: 'fa',markerColor: 'red'});              
						break;
					default:
						redMarker_plumbing = L.AwesomeMarkers.icon({icon: 'trash-o',prefix: 'fa',markerColor: 'red'});              
						break;
				}
                
                marker_plumbing = L.marker([_lattitude, _longitude], {icon: redMarker_plumbing});	

                my_markers_plumbing = L.layerGroup().addTo(map_plumbing);


                my_markers_plumbing.addLayer(marker_plumbing);	
            }
            map_plumbing.on('click', onMapClick_plumbing);
            
        }else if(count_step===4){
			data_comment='';
			console.log("4431");
			$("#modal_waiting_page").modal("toggle");
			var recom_data = '{"long":"'+ set_longitude +'","lat":"'+set_lattitude+'", "issue":"'+ issue_ch+'"}';
			
			$("#add_recomentation_result").html('');
			$.ajax({
                crossDomain: true,
                type:"POST",
                url: APIURL+"/issue_recommendation",
                contentType: "application/json; charset=utf-8",
                dataType: "json",               
                data:recom_data,                				
                success: function(msg){		
					var html_recom =language_data[language_code]._html_recom;
					if(msg.length>0){
						
						for(var k=0;k<msg[0].bugs.length;k++)
						{							
							html_recom += '<div class="panel widget panel-default uib_w_222" data-uib="twitter%20bootstrap/collapsible" data-ver="1"><div class="panel-heading"><h4 class="panel-title"><a class="accordion-toggle recommentation_click" data-toggle="collapse" href="#bs-accordion-group1-'+k+'" data-parent="#bs-accordion-0" onclick="get_recom('+msg[0].bugs[k].id+',\''+msg[0].bugs[k].alias[0]+'\',1,\'\'); mybug_comes=1;">'+msg[0].bugs[k].id+'-'+msg[0].bugs[k].url+'</a></h4></div><div id="bs-accordion-group1-'+k+'" class="panel-collapse collapse"><div class="panel-body"><div class="col uib_col_90 single-col" data-uib="layout/col" data-ver="0"><div class="widget-container content-area vertical-col" id="my_bugdiv_'+msg[0].bugs[k].id+'"><span class="uib_shim"></span></div></div></div></div></div>';
							
						}
						
						$("#modal_waiting_page").modal("toggle");
						$("#bs-accordion-0").html(html_recom);
											
					}else{
						
						html_recom +=language_data[language_code]._js_var_no_result_found;
						$("#modal_waiting_page").modal("toggle");
						
						issue_step(5);
						count_step++;
						$("#bs-accordion-0").html(html_recom);
					}
					
				},error:function(){
					$("#modal_waiting_page").modal("toggle");
				}
			});
			issue_step(4);
            
            $.ajax({
                crossDomain: true,
                type:"GET",
                url: APIURL+"/city_policy?coordinates=["+set_longitude+","+set_lattitude+"]&issue="+issue_ch,
                dataType: "json",                
                success: function(msg){
					
					console.log(msg);
					if(msg[0].add_issue==0){
						
						$("#popup_info").modal("toggle");
						$("#popup_info_details").html(msg[0].policy_desc);
						
						clear_fields();
						activate_subpage("#page_78_74"); 						
						
					}else{
					allow_anonymous = msg[0].anonymous;
                    if(msg[0].city === undefined || msg[0].city === null ){						
						
                        _city="";
                        $("#plumbing_policy_desc").html(msg[0].policy_desc);
                        $('#chk_anonymus_popup_window_plumbing').prop("disabled", true);
                    }else{				
						
                        $('#chk_anonymus_popup_window_plumbing').prop("disabled", false);
                        _city = msg[0].city;
                        $("#plumbing_policy_desc").html(msg[0].policy_desc);               
                    }
                    
                       }                 
                },
                timeout: 6000,
                error: function(){
                    //do something
                    
                
				}
            });
        }else if(count_step===5){
			
			$("#chk_email").prop("disabled", true);
			$("#chk_sms").prop("disabled", true);
			
			$.ajax({
                crossDomain: true,
                type:"POST",
                url: APIURL+"/activate_city_policy?lat=" + set_lattitude + "&long=" + set_longitude,
                dataType: "json",                				
                success: function(msg){	
					console.log(msg);
					
						
					
						mandatory_sms = msg[0].mandatory_sms;
						mandatory_email = msg[0].mandatory_email;
						if(mandatory_email=="true"){						
							$("#chk_email")[0].checked=true;
						}else{
							$("#chk_email")[0].checked=false;						
						}

						if(mandatory_sms=="true"){
							$("#chk_sms")[0].checked=true;
						}else{
							$("#chk_sms")[0].checked=false;
						}

						municipality = msg[0].municipality;
						municipality_desc = msg[0].municipality_desc;
						active_sms_service = msg[0].active_sms_service;
					
				}
			});
			issue_step(5);
			
            $.ajax({
                crossDomain: true,
                type:"GET",
                url: APIURL+"/city_policy?coordinates=["+set_longitude+","+set_lattitude+"]&issue="+issue_ch,
                dataType: "json",                
                success: function(msg){
					
					allow_anonymous = msg[0].anonymous;
                    if(msg[0].city === undefined || msg[0].city === null ){						
                        _city="";
                        $("#plumbing_policy_desc").html(msg[0].policy_desc);
                        $('#chk_anonymus_popup_window_plumbing').prop("disabled", true);
                    }else{						
                        $('#chk_anonymus_popup_window_plumbing').prop("disabled", false);
                        _city = msg[0].city;
                        $("#plumbing_policy_desc").html(msg[0].policy_desc);               
                    }
                    
                                        
                },
                timeout: 6000,
                error: function(){
                    //do something
                    
                }
            });
        }else if(count_step===6){		
			var _continue=0;
			if($('#chk_anonymus_popup_window_plumbing').is(':checked')==false && data_comment!=''){
				
				$("#popup_info").modal("toggle");
				$("#popup_info_details").html(language_data[language_code]._msg_info_register_1+JSON.parse(data_comment).bug_id+language_data[language_code]._msg_info_register_2);
				issue_step(5);				
				count_step=5;
				_continue=1;
			}
			
			
			
			if($('#chk_anonymus_popup_window_plumbing').is(':checked')){
				if(mandatory_email=="true" && mandatory_sms=="true"){					
					if(email_user=='' || mobile_user==''){
						$("#popup_info").modal("toggle");
						$("#popup_info_details").html(language_data[language_code]._msg_info_register_3);
						issue_step(5);
						count_step=5;
						_continue=1;
					}
				}else if(mandatory_email=="true" && mandatory_sms=="false"){
					if(email_user==''){
						$("#popup_info").modal("toggle");
						$("#popup_info_details").html(language_data[language_code]._msg_info_register_4);
						
						issue_step(5);
						count_step=5;
						_continue=1;
					}
				}else if(mandatory_email=="false" && mandatory_sms=="true"){
					if(mobile_user==''){
						$("#popup_info").modal("toggle");
						$("#popup_info_details").html(language_data[language_code]._msg_info_register_5);
						issue_step(5);
						count_step=5;
						_continue=1;
					}
				}
			}
			
			if($('#chk_anonymus_popup_window_plumbing').is(':checked')){
				if(data_comment=='' || data_comment==undefined){
					mybug_comes=0;
				}else{
					mybug_comes=1;
				}
				if(mybug_comes==1){				
					$("#btn_send_plumbing").html(language_data[language_code]._msg_info_register_in_a_issue_1);
				}else{
					$("#btn_send_plumbing").html(language_data[language_code]._msg_info_register_6);
				}
			}else{
				$("#btn_send_plumbing").html(language_data[language_code]._btn_send_plumbing);
			}
			
			
			
				if(_continue==0){
					var overview_title='';
					var overview_category ='';
					var overview_description ='';
					var overview_comment='';
					var overview_image='';

					if(data_comment=='' || data_comment==undefined){
						var overview_issue='';
						switch(issue_ch){
							case "garbage":
								overview_issue=language_data[language_code]._garbage;
								break;
							case "lighting":
								overview_issue=language_data[language_code]._light;
								break;
							case "environment":
								overview_issue=language_data[language_code]._environmental_issues;
								break;
							case "green":
								overview_issue=language_data[language_code]._green;
								break;
							case "protection-policy":
								overview_issue=language_data[language_code]._protection_policy;
								break;
							case "road-constructor":
								overview_issue=language_data[language_code]._road_construction;
								break;
							case "plumbing":
								overview_issue=language_data[language_code]._plumping;
								break;
							default:
								overview_issue='';
								break;
						}
						overview_title=language_data[language_code]._msg_overview_title;
						overview_image ='<div class="row" style="padding-bottom: 15px;"> <center><img src="' + $("#img_plumping").attr("src") + '" width="200px" /></center></div>';
						overview_category ='<div class="row" style="padding-bottom: 15px;"><table style="width:100%;"><tr><td width="40%"><b>'+language_data[language_code]._msg_category+' : </b> </td><td width="60%">'+overview_issue+'</td></tr></table></div>';
						overview_description ='<div class="row" style="padding-bottom: 15px;"><table style="width:100%;"><tr><td width="40%"><b>'+language_data[language_code]._msg_issue+' : </b> </td><td width="60%">'+value_description+'</td></tr></table></div>';
						overview_comment='<div class="row" style="padding-bottom: 15px;"><table style="width:100%;"><tr><td width="40%"><b>'+language_data[language_code]._msg_comment+' : </b> </td><td width="60%">'+$("#txt_plumbing_msg1").val()+'</td></tr></table></div>';	
					}else{
						var overview_issue='';
						switch(overview_obj[0].issue){
							case "garbage":
								overview_issue=language_data[language_code]._garbage;
								break;
							case "lighting":
								overview_issue=language_data[language_code]._light;
								break;
							case "environment":
								overview_issue=language_data[language_code]._environmental_issues;
								break;
							case "green":
								overview_issue=language_data[language_code]._green;
								break;
							case "protection-policy":
								overview_issue=language_data[language_code]._protection_policy;
								break;
							case "road-constructor":
								overview_issue=language_data[language_code]._road_construction;
								break;
							case "plumbing":
								overview_issue=language_data[language_code]._plumping;
								break;
							default:
								overview_issue='';
								break;
						}

						overview_title='<h3>Αίτηση εγγραφής στο αίτημα #'+JSON.parse(data_comment).bug_id+'</h3>';
						$.ajax({
							crossDomain: true,
							type:"GET",
							url: APIURL+"/image_issue?bug_id="+my_bug_id+"&resolution=small",
							contentType: "application/json; charset=utf-8",                                				
							success: function(msg1){			
								overview_image ='<div class="row" style="padding-bottom: 15px;"> <img src="'+APIURL+'/image_issue?bug_id='+my_bug_id+'&resolution=small" /></div>';									
							},
							error:function(){
								overview_image ='<div class="row" style="padding-bottom: 15px;"> <img src="/images/EmptyBox-Phone.png" /></div>';
							}						
						});
						overview_category ='<div class="row" style="padding-bottom: 15px;"><table style="width:100%;"><tr><td width="40%"><b>'+language_data[language_code]._msg_category+'</b> : </td><td width="60%">'+overview_issue+'</td></tr></table></div>';
						overview_description ='<div class="row" style="padding-bottom: 15px;"><table style="width:100%;"><tr><td width="40%"><b>'+language_data[language_code]._msg_issue+'</b> : </td><td width="60%">'+overview_obj[0].value_desc+'</td></tr></table></div>';
						overview_comment='<div class="row" style="padding-bottom: 15px;"><table style="width:100%;"><tr><td width="40%"><b>'+language_data[language_code]._msg_comment+' : </td><td width="60%">'+$("#txt_plumbing_msg1").val()+'</td></tr></table></div>';
					}

					$("#issue_overview").html(overview_title+overview_image+overview_category+overview_description+overview_comment);




					issue_step(6);


				}


			 return false;
		}
    });

	 
	 
     function onMapClick_plumbing(e) {
         
            map_plumbing.removeLayer(marker_plumbing);
            
         
            if(map_plumbing===null){
                map_plumbing = L.map('map_point_plumbing').setView( new L.LatLng( e.latlng.lat , e.latlng.lng ), 18);
            }else
            {                
                map_plumbing.panTo(new L.LatLng(e.latlng.lat , e.latlng.lng));
            }
         
            positionlat =e.latlng.lat;//msg[0].loc.coordinates[1];
			positionlon = e.latlng.lng;//msg[0].loc.coordinates[0];		
         	
		 	set_longitude = positionlon;
		 	set_lattitude = positionlat;
		 
		 
			L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>', maxZoom: 18, }).addTo(map_plumbing);
                        
            redMarker_plumbing = L.AwesomeMarkers.icon({icon: 'trash-o',prefix: 'fa',markerColor: 'red'});  
			marker_plumbing = L.marker([positionlat, positionlon], {icon: redMarker_plumbing} );
			
         
            my_markers_plumbing = L.layerGroup().addTo(map_plumbing);
            
            my_markers_plumbing.addLayer(marker_plumbing);
    }
   
     /* button  #btn_back_test */
    $(document).on("click", "#btn_plumbing_back", function(evt)
    {		
		if(count_step>0){
        	count_step--;
		}
       	
		if(count_step==4)
		{
			count_step = 3;
		}
		
        if(count_step===0){			
			issue_step(0);			
        }
        else if (count_step===1){
			issue_step(1);
        }
        else if(count_step===2){
			issue_step(2);
            map_plumbing.on('click', onMapClick_plumbing);
        }else if(count_step===3){
			issue_step(3);
        }else if(count_step===4){			
			data_comment='';			
			$("#modal_waiting_page").modal("toggle");
			var recom_data = '{"long":"'+ set_longitude +'","lat":"'+set_lattitude+'", "issue":"'+ issue_ch+'"}';
			
			$("#add_recomentation_result").html('');
			$.ajax({
                crossDomain: true,
                type:"POST",
                url: APIURL+"/issue_recommendation",
                contentType: "application/json; charset=utf-8",
                dataType: "json",               
                data:recom_data,                				
                success: function(msg){		
					var html_recom ='<h3>Μήπως εννοείται κάποιο από τα παρακάτω!</h3>';
					if(msg.length>0){						
						for(var k=0;k<msg[0].bugs.length;k++)
						{							
							html_recom += '<div class="panel widget panel-default uib_w_222" data-uib="twitter%20bootstrap/collapsible" data-ver="1"><div class="panel-heading"><h4 class="panel-title"><a class="accordion-toggle recommentation_click" data-toggle="collapse" href="#bs-accordion-group1-'+k+'" data-parent="#bs-accordion-0" onclick="get_recom('+msg[0].bugs[k].id+',\''+msg[0].bugs[k].alias[0]+'\',1,\'\'); mybug_comes=1;">'+msg[0].bugs[k].id+'-'+msg[0].bugs[k].url+'</a></h4></div><div id="bs-accordion-group1-'+k+'" class="panel-collapse collapse"><div class="panel-body"><div class="col uib_col_90 single-col" data-uib="layout/col" data-ver="0"><div class="widget-container content-area vertical-col" id="my_bugdiv_'+msg[0].bugs[k].id+'"><span class="uib_shim"></span></div></div></div></div></div>';
						}
						$("#modal_waiting_page").modal("toggle");
						$("#bs-accordion-0").html(html_recom);
					}else{
						html_recom +=language_data[language_code]._js_var_no_result_found;
						$("#modal_waiting_page").modal("toggle");
						
						issue_step(5);
						count_step++;
						$("#bs-accordion-0").html(html_recom);
					}
				},error:function(){
					$("#modal_waiting_page").modal("toggle");
				}
			});
			
			
			
			issue_step(3);
        }else if(count_step===5){
			issue_step(5);
        }else if(count_step===6){
			issue_step(6);
        }
		
         return false;
    });
    
    $('#file_plumbing').change(function (event) {
        
		
		$("#btn_plumbing_next").html(language_data[language_code]._msg_next_1);
		
         var myFile = URL.createObjectURL(event.target.files[0]);        
         var tmppath = $('#file_plumbing')[0].files[0].name.toLowerCase();
         var str1 = ".png";
         var str2 = ".jpg";
         var str3 = ".jpeg";         
		
		//$("#img_plumping").attr("src",decodeURI(myFile));
		
		var input = this;
		var url = $(this).val();
		var ext = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
		if (input.files && input.files[0]&& (ext == "gif" || ext == "png" || ext == "jpeg" || ext == "jpg")) 
		 {
			var reader = new FileReader();

			reader.onload = function (e) {
			   $('#img_plumping').attr('src', e.target.result);
				convertImgToBase64URL(e.target.result, function(base64Img){           
					image_upload = base64Img;            				 
			 	});
			}
		   reader.readAsDataURL(input.files[0]);
			 
			 
           	
			 $("#btn_plumbing_next").html(language_data[language_code]._plumbing_next);
        }else{
             alert("Επιτρεπόμενα αρχεία : Μόνο εικόνες .png, .jpg & .jpeg ");
             tmppath = "images/EmptyBox-Phone.png";             
             $("#img_plumping").attr("src",tmppath);
			$("#btn_plumbing_next").html(language_data[language_code]._plumbing_next);
             image_upload="";
             return false;
         }        
    }); 
   
     function convertImgToBase64URL(url, callback, outputFormat){
        var img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = function(){
            var canvas = document.createElement('CANVAS'),
            ctx = canvas.getContext('2d'), dataURL;
            canvas.height = img.height;
            canvas.width = img.width;
            ctx.drawImage(img, 0, 0);
            dataURL = canvas.toDataURL(outputFormat);
            callback(dataURL);
            canvas = null; 
        };
        img.src = url;
    }

    /* button  #btn_plumping */
    $(document).on("click", "#btn_plumping", function(evt)
    {
		clear_fields();
		issue_ch="plumbing";
		
		/*
		$.ajax({
			crossDomain: true,
			type:"GET",
			url: APIURL+"/city_policy?coordinates=["+_longitude+","+_lattitude+"]&issue="+issue_ch,
			dataType: "json",
			async: false,
			success: function(msg){					
				console.log(msg);
				if(msg[0].add_issue==0){
					alert('ok');
				}else
				{*/
					
		
					$("#container_issues").html('<fieldset class="widget uib_w_29 d-margins" data-uib="twitter%20bootstrap/radio_group" data-ver="1" data-child-name="bs-radio-group-3">'+
                                                '<label class="radio radio-padding-left widget uib_w_30 label_radio_btn_line_height" data-uib="twitter%20bootstrap/radio_button" data-ver="1">'+
                                                    '<input type="radio" name="bs-radio-group-3" onclick="clear_txt_plumbing()" id="voulomeno_freatio" value="Βουλωμένο Φρεάτιο"><span style="padding-left:20px; font-size:12px; position: relative; top: 7px;">'+language_data[language_code]._plumping_issue_1+'</span>'+
                                                '</label>'+
                                                '<label class="radio radio-padding-left widget uib_w_31 label_radio_btn_line_height" data-uib="twitter%20bootstrap/radio_button" data-ver="1">'+
                                                    '<input type="radio" name="bs-radio-group-3" onclick="clear_txt_plumbing()" id="spasmeno_freatio" value="Σπασμένο Καπάκι Φρεατίου"><span style="padding-left:20px; font-size:12px; position: relative; top: 7px;">'+language_data[language_code]._plumping_issue_2+'</span>'+
                                                '</label>'+
                                                '<label class="radio radio-padding-left widget uib_w_31 label_radio_btn_line_height" data-uib="twitter%20bootstrap/radio_button" data-ver="1">'+
                                                    '<input type="radio" name="bs-radio-group-3" onclick="clear_txt_plumbing()" id="diaroi_nerou" value="Διαρροή Νερού"><span style="padding-left:20px; font-size:12px; position: relative; top: 7px;">'+language_data[language_code]._plumping_issue_3+'</span>'+
                                                '</label>'+
                                                '<label class="radio radio-padding-left widget uib_w_32 label_radio_btn_line_height" data-uib="twitter%20bootstrap/radio_button" data-ver="1">'+
                                                    '<input type="radio" name="bs-radio-group-3" id="rdio_other_plumbing" onclick="focus_txt_plumbing()"><span style="padding-left:20px; font-size:12px; position: relative; top: 7px;">'+language_data[language_code]._plumping_issue_4+'</span>'+
                                                '</label>'+
                                            '</fieldset>'+
                                            '<div class="table-thing widget uib_w_33 d-margins" data-uib="twitter%20bootstrap/input" data-ver="1">'+
                                                '<label class="narrow-control"></label>'+
                                                '<input class="wide-control form-control default" type="text" placeholder="'+language_data[language_code]._plumping_issue_5+'" id="txt_plumbing_msg" onclick="enable_txt_plumbing()">'+
                                            '</div><script>$("#txt_plumbing_msg").hide(); </script>');
 
					 activate_page("#uib_page_test"); 
					 return false; 
				/*}
				                        
			},
			timeout: 6000,
			error: function(){
				//do something
                    
			}
		});
		*/
		
		
    });
    
    $(document).on("click", "#btn_header_back", function(evt)
    {
		clear_fields();
        activate_page("#mainpage"); 
        return false;
    });
    
        /* button  #btn_my_issues */
    $(document).on("click", "#btn_my_issues", function(evt)
    {
		
		clear_fields();
		console.log("1");
		
		if(email_user=='' && mobile_user==''){
			$("#popup_verify").modal("toggle");	
		}else{
			/*global activate_page */
			uib_sb.toggle_sidebar($(".uib_w_39")); 
			activate_page("#uib_my_issue"); 		

			if(email_user!="undefined" || mobile_user!="undefined"){
				console.log("email_user="+email_user+"-|-mobile_user="+mobile_user);
				var data_email = '{"email":"'+email_user+'","mobile_num":"'+mobile_user+'","status":"in_progress" }';		
		
				$("#bs-accordion-2").html("");
				$("#bs-accordion-3").html("");
				var html_findmyissue='';

				$("#modal_waiting_page").modal("toggle");
				
				$.ajax({
					crossDomain: true,
					type:"POST",
					url: APIURL+"/find_my_issue",
					dataType:"json",
					contentType: "application/json; charset=utf-8",
					data: data_email,
					success: function(msg){ 
						
						for(var i=0;i<JSON.parse(msg.body).bugs.length;i++){						
							html_findmyissue += '<div class="panel widget panel-default uib_w_222" data-uib="twitter%20bootstrap/collapsible" data-ver="1"><div class="panel-heading"><h4 class="panel-title"><a class="accordion-toggle recommentation_click" data-toggle="collapse" href="#bs-accordion-group1-'+i+'" data-parent="#bs-accordion-0" onclick="get_recom('+JSON.parse(msg.body).bugs[i].id+',\''+JSON.parse(msg.body).bugs[i].alias[0]+'\',0,\''+JSON.parse(msg.body).bugs[i].cf_city_name+'\')">'+JSON.parse(msg.body).bugs[i].id+'-'+JSON.parse(msg.body).bugs[i].url+'</a></h4></div><div id="bs-accordion-group1-'+i+'" class="panel-collapse collapse"><div class="panel-body"><div class="col uib_col_90 single-col" data-uib="layout/col" data-ver="0"><div class="widget-container content-area vertical-col" id="my_bugdiv_'+JSON.parse(msg.body).bugs[i].id+'"><span class="uib_shim"></span></div></div></div></div></div>';							
						}
						
						$("#modal_waiting_page").modal("toggle");

						$("#bs-accordion-2").html(html_findmyissue);

					}					
				});

			}else{
				$("#bs-accordion-2").html("");
				$("#bs-accordion-3").html("");
			}
			return false;
		}		
    });
    

	$(document).on("click","#clk_inprogress", function(evt){
		
		clear_fields();
		if(email_user!="undefined" || mobile_user!="undefined"){				
			$("#modal_waiting_page").modal("toggle");
			var data_email = '{"email":"'+email_user+'","mobile_num":"'+mobile_user+'","status":"in_progress" }';		

			$("#bs-accordion-2").html("");
			$("#bs-accordion-3").html("");
			var html_findmyissue='';

			$.ajax({
				crossDomain: true,
				type:"POST",
				url: APIURL+"/find_my_issue",
				dataType:"json",
				contentType: "application/json; charset=utf-8",
				data: data_email,
				success: function(msg){ 		
					for(var i=0;i<JSON.parse(msg.body).bugs.length;i++){
						html_findmyissue += '<div class="panel widget panel-default uib_w_222" data-uib="twitter%20bootstrap/collapsible" data-ver="1"><div class="panel-heading"><h4 class="panel-title"><a class="accordion-toggle recommentation_click" data-toggle="collapse" href="#bs-accordion-group1-'+i+'" data-parent="#bs-accordion-0" onclick="get_recom('+JSON.parse(msg.body).bugs[i].id+',\''+JSON.parse(msg.body).bugs[i].alias[0]+'\',0,\''+JSON.parse(msg.body).bugs[i].cf_city_name+'\')">'+JSON.parse(msg.body).bugs[i].id+'-'+JSON.parse(msg.body).bugs[i].url+'</a></h4></div><div id="bs-accordion-group1-'+i+'" class="panel-collapse collapse"><div class="panel-body"><div class="col uib_col_90 single-col" data-uib="layout/col" data-ver="0"><div class="widget-container content-area vertical-col" id="my_bugdiv_'+JSON.parse(msg.body).bugs[i].id+'"><span class="uib_shim"></span></div></div></div></div></div>';
					}
					$("#modal_waiting_page").modal("toggle");
					$("#bs-accordion-2").html(html_findmyissue);						
				}
			});
		}else{
			$("#bs-accordion-2").html("");
			$("#bs-accordion-3").html("");
		}
	});

	
	$(document).on("click","#clk_resolved", function(evt){
		clear_fields();	
		if(email_user!="undefined" || mobile_user!="undefined"){
			$("#modal_waiting_page").modal("toggle");
			var data_email = '{"email":"'+email_user+'","mobile_num":"'+mobile_user+'","status":"resolved" }';		

			$("#bs-accordion-2").html("");
			$("#bs-accordion-3").html("");
			var html_findmyissue='';

			$.ajax({
				crossDomain: true,
				type:"POST",
				url: APIURL+"/find_my_issue",
				dataType:"json",
				contentType: "application/json; charset=utf-8",
				data: data_email,
				success: function(msg){ 		
					for(var i=0;i<JSON.parse(msg.body).bugs.length;i++){
						html_findmyissue += '<div class="panel widget panel-default uib_w_222" data-uib="twitter%20bootstrap/collapsible" data-ver="1"><div class="panel-heading"><h4 class="panel-title"><a class="accordion-toggle recommentation_click" data-toggle="collapse" href="#bs-accordion-group1-'+i+'" data-parent="#bs-accordion-0" onclick="get_recom('+JSON.parse(msg.body).bugs[i].id+',\''+JSON.parse(msg.body).bugs[i].alias[0]+'\',0,\''+JSON.parse(msg.body).bugs[i].cf_city_name+'\')">'+JSON.parse(msg.body).bugs[i].id+'-'+JSON.parse(msg.body).bugs[i].url+'</a></h4></div><div id="bs-accordion-group1-'+i+'" class="panel-collapse collapse"><div class="panel-body"><div class="col uib_col_90 single-col" data-uib="layout/col" data-ver="0"><div class="widget-container content-area vertical-col" id="my_bugdiv_'+JSON.parse(msg.body).bugs[i].id+'"><span class="uib_shim"></span></div></div></div></div></div>';
					}
						
					$("#modal_waiting_page").modal("toggle");
					$("#bs-accordion-3").html(html_findmyissue);
				}
			});
		}else{
			$("#bs-accordion-2").html("");
			$("#bs-accordion-3").html("");
		}
	});
	 
        /* button  #btn_return */
    
	 
    
        /* button  #btn_about_us */
    $(document).on("click", "#btn_about_us", function(evt)
    {
         /*global activate_subpage */
        uib_sb.toggle_sidebar($(".uib_w_39")); 
		activate_subpage("#sub_page_about"); 
		 
        
         return false;
    });
    
        /* button  #btn_return */
    $(document).on("click", "#btn_return", function(evt)
    {
         /*global activate_subpage */
         activate_subpage("#page_78_74"); 
         return false;
    });
    
        /* button  #btn_settings */
    /*
	 $(document).on("click", "#btn_setting", function(evt)
    {
      	
		uib_sb.toggle_sidebar($(".uib_w_39")); 
         return false;
    });
    */
        /* button  #btn_setting */
    $(document).on("click", "#btn_setting", function(evt)
    {
         /*global activate_subpage */
         activate_subpage("#sub_page_settings"); 
		uib_sb.toggle_sidebar($(".uib_w_39")); 
		console.log(language_code);
		if(language_code == '_en'){
			console.log(language_code);
			$("#btn_en").prop("checked",true);
			//$("#btn_en_1").prop("checked",true);
			//updateIndexedDB(name_user, email_user, mobile_user, language_user);
		}else{
			$("#btn_gr").prop("checked",true);
			//$("#btn_gr_1").prop("checked",true);
			//updateIndexedDB(name_user, email_user, mobile_user, language_user);
		} 
         return false;
    });
	 
	$(document).on("click","#btn_send_neighbor", function(evt){
		
		//alert("ouou==>"+set_longitude + "|"+set_lattitude+"|"+$("#txtRoundInMeter").val()+"|"+JSON.parse(device_uuid.name));
		var txtRoundInMeter = $("#txtRoundInMeter").val();
		var nameDevice = device_uuid.name;
		
		var dataParams='{"set_longitude":"'+set_longitude+'","set_lattitude":"'+set_lattitude+'","userEmail":"'+$("#txtEmail").val()+'"}';

		console.log(dataParams);
		console.log(APIURL);
		
		$.ajax({
			crossDomain: true,
			type:"POST",
			url: APIURL+"/inineighbor",
			dataType:"json",
			contentType: "application/json; charset=utf-8",
			data: dataParams,
			success: function(msg){ 		
					console.log(msg);
				alert(JSON.stringify(msg));
			}
		});
		
	});
	 
	 $(document).on("click","#btn_en", function(evt){
		 
		 language_code="_en";	
		 language_user="en";
		 console.log(language_code);
		 updateIndexedDB(name_user, email_user, mobile_user, language_user);
		 reset_language();
	 });
	 
	 $(document).on("click","#btn_gr", function(evt){
		 language_code="_gr";
		 language_user="gr";
		 console.log(language_code);
		 updateIndexedDB(name_user, email_user, mobile_user, language_user);
		 reset_language();
	 });
	 
	 $(document).on("click","#btn_en_1", function(evt){
		 
		 language_code="_en";	
		 language_user="en";
		 console.log(language_code);
		 updateIndexedDB(name_user, email_user, mobile_user, language_user);
		 reset_language();
	 });
	 
	 $(document).on("click","#btn_gr_1", function(evt){
		 language_code="_gr";
		 language_user="gr";
		 console.log(language_code);
		 updateIndexedDB(name_user, email_user, mobile_user, language_user);
		 reset_language();
	 });
	 
        /* button  #btn_neighbor */
    $(document).on("click", "#btn_neighbor", function(evt)
    {
         /*global activate_subpage */
         activate_subpage("#sub_neighbor"); 
		uib_sb.toggle_sidebar($(".uib_w_39")); 
		
		
		
		
		/* Start Create map */
		_lattitude=38.25722324127359;
		_longitude=21.740249288391613;
		console.log(_lattitude + "<-->"+_longitude);
		
		mapNeighbor = L.map('mapNeighbor').setView( new L.LatLng( _lattitude, _longitude ), 18);                
        positionlat = _lattitude;//msg[0].loc.coordinates[1];
        positionlon = _longitude;//msg[0].loc.coordinates[0];						
		set_lattitude=_lattitude;
		set_longitude=_longitude;

        L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>', maxZoom: 18, }).addTo(mapNeighbor);
				
		redMarker_neighbor = L.AwesomeMarkers.icon({icon: 'trash-o',prefix: 'fa',markerColor: 'red'});       
		
		marker_neighbor = L.marker([_lattitude, _longitude], {icon: redMarker_neighbor});	

        my_markers_neighbor = L.layerGroup().addTo(mapNeighbor);

		my_markers_neighbor.addLayer(marker_neighbor);	
        
        mapNeighbor.on('click', onMapClick_neighbor);
		
		
		/* end map */
		
		
		
		
		
         return false;
    });
    
        /* button  #btnWarnNeighbor */
    $(document).on("click", "#btnWarnNeighbor", function(evt)
    {
         /*global activate_subpage */
         activate_subpage("#myneighborWarnings"); 
		
		/* get messages */
		
		/* end messages */
         return false;
    });
    
    }
	
	
	 function onMapClick_neighbor(e) {
         
            mapNeighbor.removeLayer(marker_neighbor);
            
         
            if(mapNeighbor===null){
                mapNeighbor = L.map('map_point_plumbing').setView( new L.LatLng( e.latlng.lat , e.latlng.lng ), 18);
            }else
            {                
                mapNeighbor.panTo(new L.LatLng(e.latlng.lat , e.latlng.lng));
            }
         
            positionlat =e.latlng.lat;//msg[0].loc.coordinates[1];
			positionlon = e.latlng.lng;//msg[0].loc.coordinates[0];		
         	
		 	set_longitude = positionlon;
		 	set_lattitude = positionlat;
		 
			L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>', maxZoom: 18, }).addTo(mapNeighbor);
                        
            redMarker_neighbor = L.AwesomeMarkers.icon({icon: 'trash-o',prefix: 'fa',markerColor: 'red'});  
			marker_neighbor = L.marker([positionlat, positionlon], {icon: redMarker_neighbor} );
			
         
            my_markers_neighbor = L.layerGroup().addTo(mapNeighbor);
            
            my_markers_neighbor.addLayer(marker_neighbor);
    }
	
	
	
	
	function reset_language(){
		//alert("test1");
		//alert(language_code);
		 //$.getJSON('js/language.json', function(data) {
			 
			//language_data = data;
			 
		   	//console.log(language_data);
			//console.log(language_code);
		
			$("#btn_garbage").html(language_data[language_code]._garbage);	
			$("#btn_light").html(language_data[language_code]._light);	
			$("#desc_garbage").html(language_data[language_code]._desc_garbage);	
			$("#desc_lighting").html(language_data[language_code]._desc_light);	
			$("#btn_road_construction").html(language_data[language_code]._road_construction);	
			$("#desc_road_construction").html(language_data[language_code]._desc_road_construction);	
			$("#btn_protection_policy").html(language_data[language_code]._protection_policy);	
			$("#desc_policy_protection").html(language_data[language_code]._desc_protection_policy);
			$("#btn_green").html(language_data[language_code]._green);	
			$("#desc_green").html(language_data[language_code]._desc_green);
			$("#btn_environmental_issues").html(language_data[language_code]._environmental_issues);	
			$("#desc_enviroment").html(language_data[language_code]._desc_environmental_issues);
			$("#btn_plumping").html(language_data[language_code]._plumping);	
			$("#desc_plumping").html(language_data[language_code]._desc_plumping);		
			$("#msg_society_fellings").html(language_data[language_code]._msg_society_fellings);
			$("#_lbl_header_back").html(language_data[language_code]._lbl_header_back);
			$("#btn_home_page").html(language_data[language_code]._home_page);
			$("#btn_my_issues").html(language_data[language_code]._my_issues);
			$("#btn_about_us").html(language_data[language_code]._about_us);
			$("#btn_map").html(language_data[language_code]._map);
			$("#btn_policy").html(language_data[language_code]._policy);
			$("#btn_send_report_sensecity").html(language_data[language_code]._send_report_sensecity);
			$("#report_msg1").html(language_data[language_code]._report_msg1);
			$("#report_msg2").html(language_data[language_code]._report_msg2);
			$("#btn_cancel_email").html(language_data[language_code]._cancel_email);
			$("#btn_send_mail").html(language_data[language_code]._send_mail);
			$("#btn_popup_return").html(language_data[language_code]._popup_return);
			$("#lbl_epipleon_paratirisis").html(language_data[language_code]._epipleon_paratirisis);
			$("#txt_plumbing_msg1").attr("placeholder",language_data[language_code]._plumbing_msg1);
			$("#btn_get_picture_plumbing").html(language_data[language_code]._get_picture_plumbing);
			$("#lbl_anonymus_report").html(language_data[language_code]._anonymus_report);
			$("#plumbing_policy_desc").html(language_data[language_code]._plumbing_policy_desc);
			$("#_anonymus_popup_window_plumbing").html(language_data[language_code]._anonymus_popup_window_plumbing);
			$("#collapse_info_panel").html(language_data[language_code]._collapse_info_panel);
			$("#lbl_email").html(language_data[language_code]._ldl_email);
			$("#lbl_sms").html(language_data[language_code]._lbl_sms);
			$("#btn_change_user_info").html(language_data[language_code]._change_user_info);
			$("#btn_send_plumbing").html(language_data[language_code]._send_plumbing);
			$("#btn_plumbing_cancel").html(language_data[language_code]._plumbing_cancel);
			$("#btn_plumbing_back").html(language_data[language_code]._plumbing_back);
			$("#btn_plumbing_next").html(language_data[language_code]._plumbing_next);
			$("#btn_send_plumbing").html(language_data[language_code]._send_plumbing);
			$("#clk_inprogress").html(language_data[language_code]._clk_inprogress);
			$("#btn_popup_return_new").html(language_data[language_code]._popup_return_new);		
			$("#lbl_header_back").html(language_data[language_code]._header_back);
			$("#file_plumbing_label_1").html(language_data[language_code]._file_plumbing_label);
			$(".modal_verify_user").html(language_data[language_code]._modal_verify_user);
			$("#txt_popup_name").attr("placeholder",language_data[language_code]._txt_popup_name);
			$("._modal_verify_txt_msg").html(language_data[language_code]._modal_verify_txt_msg);
			$("._btn_verify_msg_email").html(language_data[language_code]._btn_verify_email);
			$("._modal_verify_txt_msg_mobile").html(language_data[language_code]._modal_verify_txt_msg_mobile);
			$("#txt_mobile_number").attr("placeholder",language_data[language_code]._txt_mobile_number);
			$("#btn_verify_sms").html(language_data[language_code]._btn_verify_sms);
			$("#btn_popup_close_verify").html(language_data[language_code]._btn_popup_close_verify);
			$("#modal_email_certification_header").html(language_data[language_code]._modal_email_certification_header);
			$("#modal_info_title").html(language_data[language_code]._modal_info_title);
			$("#modal_info_close_btn").html(language_data[language_code]._modal_info_close_btn);
			$("#modal_info_send_issue_title").html(language_data[language_code]._modal_info_send_issue_title);
			$("#modal_info_send_issue_title_1").html(language_data[language_code]._modal_info_send_issue_title);
			$("#popup_report").html(language_data[language_code]._popup_report);
			$("#popup_report_1").html(language_data[language_code]._popup_report);
			$("#modal_info_send_issue_publish").html(language_data[language_code]._modal_info_send_issue_publish);
			$("#msg_modal_published").html(language_data[language_code]._modal_info_send_issue_publish);
			$("#btn_popup_return_new").html(language_data[language_code]._btn_popup_return_new);
			$("#mail_subject").attr("placeholder",language_data[language_code]._txt_send_mail_placeholder);
			$("#mail_content").attr("placeholder",language_data[language_code]._txtarea_send_mail_placeholder);
			$("#lbl_btn_en").html(language_data[language_code]._lbl_btn_en);
			$("#lbl_btn_gr").html(language_data[language_code]._lbl_btn_gr);
			$("#lbl_header_title").html(language_data[language_code]._lbl_header_title);
			$("#btn_setting").html(language_data[language_code]._btn_setting);
			 
		//});
	}
	
    function clear_fields(){
		
		//checkConnection();
		current_step=0;
		issue_step(0);
		
        image_upload="";
        issue_ch="";
		value_description="";
		
		set_lattitude = 0;
		set_longitude = 0;
		
        map1=undefined;
        redMarker1=undefined;  
        marker1=undefined;
        my_markers=undefined;
        positionlat=undefined;
        positionlon=undefined;         
        
		
        map_plumbing = undefined;
        redMarker_plumbing = undefined;
		redMarker_neighbor = undefined;
        marker_plumbing = undefined;
		marker_neighbor = undefined;
        my_markers_plumbing = undefined;
        my_markers_neighbor = undefined;
		
		my_bug_id='';
		data_comment = '';
		mybug_comes=0;
		
		$("#bs-accordion-0").html("");
		$("#bs-accordion-2").html("");
		$("#bs-accordion-3").html("");
		$("#add_recomentation_result").html('');
		
        //$("#btn_popup_final_verify").html(language_data[language_code]._btn_verify_email);
		//$('#btn_verify_email').html('<i class="fa fa-shield button-icon-left" data-position="left"></i>Πιστοποίηση');
		
		//$('#btn_verify_email').html(language_data[language_code]._btn_verify_email);
		$('#msg_popup_verify_email_txt').html("");
		
		/*-  Popup Verification  -*/
		
		$("#txt_popup_name").val('');
		$("#txt_email_verify_popup").val('');
		$("#txt_mobile_number").val('');
		
		/*-  end  -*/
		
		
		$("#txt_popup_name").val('');
		$("#txt_email_verify_popup").val('');
		$("#txt_mobile_number").val('');
		$("#txt_popup_plumbing_verify_code_email").val('');
		$("#txt_popup_plumbing_verify_sms_code").val('');
		
		
        $("#txt_garbage_msg").hide();
        $("#txt_lighting_msg").hide();
        $("#txt_plumbing_msg").hide();
        $("#txt_road_msg").hide();
        $("#txt_protection_policy_other").hide();
        $("#txt_green_msg").hide();
        $("#txt_enviroment_issue").hide();
        
		
        count_step=0;
		
        $("#step_plumbing_4").html('<div id="map_point_plumbing" style="color: black; height:60vh;"></div>');
        //$("#btn_send_plumbing").html(language_data[language_code]._btn_send_plumbing);
       
        $("#img_plumping").attr("src","images/EmptyBox-Phone.png");
       
        value_description = '';
		
        $("#send_mail_msg").html("");
        $("#mail_subject").val("");
        $("#mail_content").val("");
            
		
        // *** Garbage *** 
        $("#xalamenos").prop("checked",false);
        $("#ogkodis_antikeimena").prop("checked",false);
        $("#komena_kladia").prop("checked",false);
        $("#mpaza").prop("checked",false);
        $("#katharismos_plateias").prop("checked",false);
        $("#mixanokiniti_sarosi").prop("checked",false);
        $("#allo_garbage").prop("checked",false);
        $("#txt_garbage_msg").val("");
        $("#txt_garbage_msg1").val("");
        $('#katapatisi_koinoxriston_xoron').prop("checked",false);
       
		
		
        // *** lighting *** 
        $("#kamenos_lamptiras").prop("checked",false);
        $("#spasmenos_vraxionas").prop("checked",false);
        $("#aneparkis_fotismos").prop("checked",false);
        $("#topothetisi_fotismos").prop("checked",false);
        $("#rdio_other_light").prop("checked",false);
        $("#txt_lighting_msg").val("");
        $("#txt_lighting_msg1").val("");
        
        // *** plumbing *** 
        $("#voulomeno_freatio").prop("checked",false);
        $("#spasmeno_freatio").prop("checked",false);
        $("#diaroi_nerou").prop("checked",false);
        $("#rdio_other_plumbing").prop("checked",false);
        $("#txt_plumbing_msg").val("");
        $("#txt_plumbing_msg1").val("");
        $("#btn_send_plumbing").prop("disabled", false);
        $("#setting_plumbing_alert").css("display","none");
        $("#chk_anonymus_popup_window_plumbing").prop("checked",false);
		
        // *****   Anonymous check box *****
        //$("#btn_send_plumbing").html(language_data[language_code]._btn_send_plumbing);      
        $("#txt_plumbing_settings_name").val('');
        $("#txt_plumbing_settings_email").val('');
        $("#txt_plumbing_settings_mobile").val('');
        
        
        // *** road/squares/walk road *** 
        $("#lakouva").prop("checked",false);
        $("#spasmenes_plakes_pez").prop("checked",false);
        $("#egkatalelimeno_autokinito").prop("checked",false);
        $("#katalipsi_pezodromiou").prop("checked",false);
        $("#spasmeno_pagkaki").prop("checked",false);
        $("#kakotexnia").prop("checked",false);
        $("#rdio_other_road").prop("checked",false);
        $("#txt_road_msg").val("");
        $("#txt_constructor_msg").val("");
        
        // *** protection-policy *** 
        $("#protection_policy_theomynia").prop("checked",false);
        $("#protection_policy_allo").prop("checked",false);
        $("#txt_protection_policy_other").val("");
        $("#txt_protection_policy_msg").val("");
        
        // *** green *** 
        $("#btn_green_kopi_xorton").prop("checked",false);
        $("#btn_green_kladeuma_dentron").prop("checked",false);
        $("#btn_green_allo").prop("checked",false);
        $("#txt_green_msg").val("");
        $("#txt_green_msg1").val("");
            
        // *** enviroment ***
        $("#adespoto_zoo").prop("checked",false);
        $("#anakyklwsi").prop("checked",false);
        $("#allo_enviroment").prop("checked",false);
        $("#btn_green_mioktonies").prop("checked",false);
        $("#btn_green_entomoktonia").prop("checked",false);
        $("#txt_enviroment_issue").val("");
                 
        // *** popup
        $("#verify_msg_popup").css("display","none");
        $("#txt_pop_up_activate_code").css("display","none");
        $("#txt_popup_settings_name").val("");
        $("#txt_popup_settings_email").val("");
        $("#txt_popup_settings_mobile").val("");
		
		if($("#bs-accordion-group-0").hasClass('collapse in')){			
			$("#bs-accordion-group-0").collapse("toggle");
		}
		
		
		//get_db();
		
    }
    
    var options = {maximumAge: 3000,timeout: 5000, enableHighAccuracy: true };
    
    //Success callback
    var suc = function(p) {
        
        _lattitude = p.coords.latitude;
        _longitude = p.coords.longitude;
        if(_lattitude>0 && _longitude>0){
            $("#lbl_geolocation").html("Geolocation Sense ON!"+_longitude+" - "+_lattitude);
        }
        else{
            $("#lbl_geolocation").html("Geolocation Sense OFF!"+_longitude+" - "+_lattitude);
        }
    };
	var fail = function() {         
        $("#lbl_geolocation").html("Geolocation failed. \nPlease enable GPS in Settings.", 1);
    };
    
    document.addEventListener("app.Ready", register_event_handlers, false);   
    
    var garbageMarkers;
    var lightingMarkers;
    var plumpingMarkers;
    var roadConstMarkers;
    var smiliesMarkers;
    var greenMarkers;
    var environmentMarkers;
    var protection_policyMarkers;
    var layers_ref;
    
    var marker_array=[];
    
   function show_map(){
       
        for(var k=0;k<marker_array.length;k++){
            map.removeLayer(marker_array[k]);            
        }
        
        marker_array=[];
       
        $.ajax({ 
					crossDomain: true,
					type:"GET",
					url: APIURL+"/mobilemap?coordinates=[" + _longitude + "," + _lattitude + "]",
					dataType: "json",                
					success: function(msg){
						redMarker = null;                        
                        
						//var zoom = 13;
						//var fromProjection = new OpenLayers.Projection("EPSG:4326");   // Transform from WGS 1984
						//var toProjection   = new OpenLayers.Projection("EPSG:900913"); // to Spherical Mercator Projection
						var count_pos =0;
						//var position[] = new Array();
						
						var positionlat = _lattitude;//msg[0].loc.coordinates[1];
						var positionlon = _longitude;//msg[0].loc.coordinates[0];						
			
						L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
						attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
						maxZoom: 18, }).addTo(map);
                        
                        if(map !== null ){ 
                            garbageMarkers = L.layerGroup().addTo(map);                             
                            lightingMarkers = L.layerGroup().addTo(map);
                            plumpingMarkers = L.layerGroup().addTo(map);
                            roadConstMarkers = L.layerGroup().addTo(map);
                            greenMarkers = L.layerGroup().addTo(map);
                            environmentMarkers = L.layerGroup().addTo(map);
                            protection_policyMarkers = L.layerGroup().addTo(map);
                            smiliesMarkers = L.layerGroup().addTo(map);
						}
                       
						$.each(msg, function(idx, obj) {
                            
							var positionlat = obj.loc.coordinates[1];
							var positionlon = obj.loc.coordinates[0];
							
							if (obj.issue === 'lighting') 
							{
								redMarker = L.AwesomeMarkers.icon({
									icon: 'lightbulb-o',
									prefix: 'fa',
									markerColor: 'orange'});  
								marker = L.marker([positionlat, positionlon], {icon: redMarker});					
								marker.bindPopup(obj.value_desc);
								lightingMarkers.addLayer(marker);			
							}else if (obj.issue === 'garbage') 
							{
								redMarker = L.AwesomeMarkers.icon({icon: 'trash-o', prefix: 'fa', markerColor: 'orange'});
								marker = L.marker([positionlat, positionlon], {icon: redMarker});
                                
								garbageMarkers.addLayer(marker);								
								marker.bindPopup(obj.value_desc);
                                
							}else if (obj.issue === 'road-construction') 
							{
								redMarker = L.AwesomeMarkers.icon({
									icon: 'road',
									prefix: 'fa',
									markerColor: 'orange'});
								marker = L.marker([positionlat, positionlon], {icon: redMarker});
								roadConstMarkers.addLayer(marker);	
								marker.bindPopup(obj.value_desc);
							}else if (obj.issue === 'plumping') 
							{
								redMarker = L.AwesomeMarkers.icon({
									icon: 'umbrella',
									prefix: 'fa',
									markerColor: 'orange'});
								marker = L.marker([positionlat, positionlon], {icon: redMarker});
								plumpingMarkers.addLayer(marker);
								
								marker.bindPopup(obj.value_desc);
							}else if (obj.issue === 'green') 
							{
								redMarker = L.AwesomeMarkers.icon({
									icon: 'tree',
									prefix: 'fa',
									markerColor: 'orange'});
								marker = L.marker([positionlat, positionlon], {icon: redMarker});
								greenMarkers.addLayer(marker);
								
								marker.bindPopup(obj.value_desc);
							}else if (obj.issue === 'environment') 
							{
								redMarker = L.AwesomeMarkers.icon({
									icon: 'leaf',
									prefix: 'fa',
									markerColor: 'orange'});
								marker = L.marker([positionlat, positionlon], {icon: redMarker});
								environmentMarkers.addLayer(marker);
								
								marker.bindPopup(obj.value_desc);
							}else if (obj.issue === 'protection-policy') 
							{
								redMarker = L.AwesomeMarkers.icon({
									icon: 'shield',
									prefix: 'fa',
									markerColor: 'orange'});
								marker = L.marker([positionlat, positionlon], {icon: redMarker});
								protection_policyMarkers.addLayer(marker);
								
								marker.bindPopup(obj.value_desc);
							}
                            else
							{	
								var ic = 'smile-o';
								if (obj.issue === 'neutral')
								{
										ic = 'meh-o';
								} else if (obj.issue === 'angry')
								{
										ic = 'frown-o';
								}
										
								redMarker = L.AwesomeMarkers.icon({
									icon: ic,
									prefix: 'fa',
									markerColor: 'lightgreen',
									iconColor: 'darkgreen'});
								marker = L.marker([positionlat, positionlon], {icon: redMarker});
								marker.bindPopup(obj.value_desc);
								smiliesMarkers.addLayer(marker);
							}
							marker_array.push(marker);
						});
                            
                        if(layers_ref!==undefined)
                             layers_ref.removeFrom(map);
                            
                            var overlayMaps = {
                                "Προβλήματα σκουπιδιών": garbageMarkers,
                                "Προβλήματα φωτισμού": lightingMarkers,
                                "Προβλήματα ύδρευσης": plumpingMarkers,
                                "Προβλήματα οδοστρώματος": roadConstMarkers,
                                "Προβλήματα πρασίνου": greenMarkers,
                                "Προβλήματα περιβαλλοντικά": environmentMarkers,
                                "Προβλήματα πολιτικής προστασίας": protection_policyMarkers,
                                "Ανάδραση πολιτών": smiliesMarkers
                            };	

                            layers_ref = L.control.layers(null, overlayMaps).addTo(map);
					}
					
				});
		
				$('a.page-scroll').bind('click', function(event) {
					var $anchor = $(this);
					$('html, body').stop().animate({
						scrollTop: ($($anchor.attr('href')).offset().top - 50)
					}, 1250, 'easeInOutExpo');
					event.preventDefault();
				});
        
   }
    
    function enable_issue_form(){
        $("#btn_send_plumbing").prop("disabled",false);
        $("#txt_popup_settings_name").attr('disabled', false);
        $("#txt_popup_settings_email").attr('disabled', false);
        $("#txt_popup_settings_mobile").attr('disabled', false);        
    }
    
    function disable_issue_form(){
        $("#btn_send_plumbing").prop("disabled",false);
        $("#txt_popup_settings_email").attr('disabled', true);
        $("#txt_popup_settings_name").attr('disabled', true);
        $("#txt_popup_settings_mobile").attr('disabled', true);
        
    }
    
    function get_device_uuid()
    {
        window.plugins.uniqueDeviceID.get(success,fail);
    }
    
	/*
	var successLocationCallback = function(Loc_msg){		 
		try {
            if (navigator.geolocation !== null) {

                navigator.geolocation.watchPosition(suc, fail, options);
            }
        } catch (e) {
            navigator.notification.alert(e.message);
        }
		
	};
	
	var errorLocationCallback = function(Loc_err){		
		cordova.plugins.diagnostic.switchToLocationSettings();
		cordova.plugins.diagnostic.isLocationAvailable(successLocationCallback, errorLocationCallback);
	};
	*/
	
	
    function onDeviceReady() {
		 
		//cordova.plugins.diagnostic.isLocationAvailable(successLocationCallback, errorLocationCallback);
		//alert(language_user);
		
		
		if(language_user=='gr'){
			language_code = '_gr';			
		}else if(language_user=='en'){
			language_code = '_en';			
		}else{
			language_code = '_gr';
			$("#popup_info_language").modal("toggle"); 
		}
		
		
		
        try {
            if (navigator.geolocation !== null) {

                navigator.geolocation.watchPosition(suc, fail, options);
            }
        } catch (e) {
            navigator.notification.alert(e.message);
        }
		

        try {
            navigator.splashscreen.hide(); 
        } catch (e) { }
        
        get_device_uuid();
        disable_issue_form();
		reset_language();

    }
	
	function checkConnection() {
           
        var networkState = navigator.connection.type;
          
        if(networkState=='none'){
            return false;
        }else{
            return true;
            
        }
        
    }
	
    
    function success(uuid)
    {
        device_uuid = uuid;
    }     
	
    document.addEventListener("deviceready", onDeviceReady, true);
	
})();
