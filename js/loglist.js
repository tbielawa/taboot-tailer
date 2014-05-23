// loglist.js - Populates available log menu, handles direct linking
// (query params), and show/hide functionality.
//
// Load after jQuery, timer, and querystring
// Load before main.js

SITES = {
    'PHX1': 'http://phx1.yoursite.com/logs/taboot',
    'PHX2': 'http://phx2.yoursite.com/logs/taboot',
};

DEFAULT_SITE = 'PHX1';
if ($.QueryString("site")) {
    CURRENT_SITE = $.QueryString("site").replace(/#.*$/,"");
} else {
    CURRENT_SITE = DEFAULT_SITE;
}

$(document).ready(function(){
    setup_autoscroll();
    build_tabs();
    flash_new_feature_alert();
    $('#logsloading').fadeIn(500, function() {
        $.ajax({
            url: SITES[CURRENT_SITE] + "/?C=M;O=D",
            cache: false,
            dataType: 'text',
            success: function(data) {
                build_log_list(data, CURRENT_SITE);
            },
        }).done(function(jq, ts) {
            // handle direct links to logs via query parameters
            if ($.QueryString("log")) {
                // Strip off any anchors
                var log = $.QueryString("log").replace(/#.*$/,"");
                start_following(log);
                highlight_named_log(log);
            }

            click_handlers();
        });
    });

    $('#li-get_help').click(function() {
	$('#myModal').modal('show');
    });

    $('#li-download_log').click(function() {
	window.location = SITES[CURRENT_SITE] + "/" + currently_following;
    });

    $('#li-go_to_top').click(function() {
	window.scrollTo(0, 0);
	if (autoscroll) {
	    autoscroll = !autoscroll;
	    $("#li-toggle_autoscroll").toggleClass("active");
	}
    });

    $('#sites li a').click(function(obj) {
        var old_site = CURRENT_SITE;
        CURRENT_SITE = $(this).text();
        highlight_current_site();
        clear_site_logs(old_site);
        $('#logsloading').fadeIn(500, function() {
            $.ajax({
                url: SITES[CURRENT_SITE] + "/?C=M;O=D",
                cache: false,
                dataType: 'text',
                success: function(data) {
                    build_log_list(data, CURRENT_SITE);
                },
            }).done(function(jq, ts) {
                click_handlers();
            });
        });
    });
});
